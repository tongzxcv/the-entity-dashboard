from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import sqlite3
import json
import logging
from pathlib import Path
import urllib.request
import urllib.error
import asyncio
import psutil
import os
import base64
import hashlib
import hmac
import time
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ENABLE_API_DOCS = os.getenv("ENABLE_API_DOCS", "").lower() in {"1", "true", "yes"}
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://161.118.245.238:3000").split(",")
    if origin.strip()
]
INGEST_API_KEY = os.getenv("INGEST_API_KEY", "")
AUTH_SECRET = (os.getenv("AUTH_SECRET") or INGEST_API_KEY or "forex-ea-dashboard-local-auth").encode("utf-8")
SESSION_COOKIE = "forex_session"
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "43200"))

def env_flag(name: str, default: bool) -> bool:
    fallback = "true" if default else "false"
    return os.getenv(name, fallback).strip().lower() in {"1", "true", "yes", "on"}


DEMO_PRIVACY = {
    "hide_account_ids": env_flag("DEMO_HIDE_ACCOUNT_IDS", True),
    "hide_tickets": env_flag("DEMO_HIDE_TICKETS", True),
    "hide_open_prices": env_flag("DEMO_HIDE_OPEN_PRICES", True),
    "hide_brokers": env_flag("DEMO_HIDE_BROKERS", False),
    "hide_lots": env_flag("DEMO_HIDE_LOTS", False),
    "hide_pnl": env_flag("DEMO_HIDE_PNL", False),
}

AUTH_USERS = {
    "admin": {"password": os.getenv("ADMIN_PASSWORD", ""), "role": "admin"},
    "demo": {"password": os.getenv("DEMO_PASSWORD", "demo"), "role": "demo"},
}

app = FastAPI(
    title="Forex EA Mission Control API",
    version="1.6.8",
    docs_url="/docs" if ENABLE_API_DOCS else None,
    redoc_url="/redoc" if ENABLE_API_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_API_DOCS else None,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key"],
)

DB_PATH = Path("/app/data/forex_ea.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
LOG_FILE_PATH = "/app/external_logs/service.log" 


class AccountNameUpdate(BaseModel):
    display_name: str = ""


class LoginRequest(BaseModel):
    username: str
    password: str

def load_api_keys():
    raw_json = os.getenv("LLM_API_KEYS_JSON", "").strip()
    if raw_json:
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, dict):
                return {str(k): str(v) for k, v in parsed.items() if v}
        except json.JSONDecodeError:
            logger.warning("LLM_API_KEYS_JSON is invalid JSON")

    pairs = {}
    for item in os.getenv("LLM_API_KEYS", "").split(","):
        if "=" in item:
            name, key = item.split("=", 1)
            name = name.strip()
            key = key.strip()
            if name and key:
                pairs[name] = key
    return pairs


API_KEYS = load_api_keys()
QUOTA_DATA = {name: {"status": "⏳ Checking...", "pct": 0, "reset_time": "-"} for name in API_KEYS}

def require_ingest_key(request: Request):
    if not INGEST_API_KEY:
        raise HTTPException(status_code=503, detail="INGEST_API_KEY is not configured")
    provided_key = request.headers.get("x-api-key", "")
    if provided_key != INGEST_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_session_token(username: str, role: str) -> str:
    payload = {"username": username, "role": role, "exp": int(time.time()) + SESSION_TTL_SECONDS}
    payload_raw = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _b64url(hmac.new(AUTH_SECRET, payload_raw.encode("ascii"), hashlib.sha256).digest())
    return f"{payload_raw}.{signature}"


def read_session(request: Request):
    token = request.cookies.get(SESSION_COOKIE, "")
    if "." not in token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload_raw, signature = token.rsplit(".", 1)
    expected = _b64url(hmac.new(AUTH_SECRET, payload_raw.encode("ascii"), hashlib.sha256).digest())
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid session")
    try:
        payload = json.loads(_b64url_decode(payload_raw).decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Session expired")
    return {"username": payload.get("username"), "role": payload.get("role")}


def require_user(request: Request):
    return read_session(request)


def require_admin(request: Request):
    user = read_session(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return user


def sanitize_demo_dashboard(payload: dict) -> dict:
    accounts = payload.get("accounts", [])
    alias_by_account = {
        str(account.get("account_number")): f"INVESTOR-{index + 1:02d}"
        for index, account in enumerate(sorted(accounts, key=lambda item: str(item.get("account_number", ""))))
    }
    trade_index = 0

    for account in accounts:
        original_account = str(account.get("account_number", ""))
        alias = alias_by_account.get(original_account, "INVESTOR")
        if DEMO_PRIVACY["hide_account_ids"]:
            account["account_number"] = alias
        if DEMO_PRIVACY["hide_brokers"]:
            account["broker"] = "Private broker"
        if DEMO_PRIVACY["hide_pnl"]:
            account["equity"] = account.get("balance", 0)
            account["total_closed_pnl"] = 0
            account["peak_drawdown_amount"] = 0
            account["drawdown_percent"] = 0
            account["peak_drawdown_percent"] = 0
        if DEMO_PRIVACY["hide_lots"]:
            account["total_closed_lots"] = 0
            account["rebate_lots_total"] = 0
            account["rebate_total"] = 0
            account["rebate_rate"] = 0

        for trade in account.get("open_trades", []):
            trade_index += 1
            if DEMO_PRIVACY["hide_account_ids"]:
                trade["account_number"] = alias
            if DEMO_PRIVACY["hide_tickets"]:
                trade["ticket"] = f"Trade-{trade_index}"
            if DEMO_PRIVACY["hide_open_prices"]:
                trade["open_price"] = None
                trade["current_price"] = None
            if DEMO_PRIVACY["hide_lots"]:
                trade["lots"] = 0
            if DEMO_PRIVACY["hide_pnl"]:
                trade["profit"] = 0

        for row in account.get("daily_history", []):
            if DEMO_PRIVACY["hide_account_ids"]:
                row["account_number"] = alias
            if DEMO_PRIVACY["hide_lots"]:
                row["daily_lots"] = 0
                row["daily_rebate_lots"] = 0
                row["daily_rebate"] = 0
            if DEMO_PRIVACY["hide_pnl"]:
                row["daily_profit"] = 0

    for snapshot in payload.get("equity_snapshots", []):
        original_account = str(snapshot.get("account_number", ""))
        if DEMO_PRIVACY["hide_account_ids"]:
            snapshot["account_number"] = alias_by_account.get(original_account, "INVESTOR")
        if DEMO_PRIVACY["hide_pnl"]:
            snapshot["equity"] = snapshot.get("balance", 0)
            snapshot["floating"] = 0
            snapshot["drawdown_percent"] = 0

    if DEMO_PRIVACY["hide_pnl"]:
        payload["summary"]["total_equity"] = sum(account.get("balance", 0) for account in accounts)
        payload["summary"]["total_floating_profit"] = 0
    return payload


def init_db():
    conn = sqlite3.connect(str(DB_PATH)); cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, account_number TEXT UNIQUE NOT NULL, broker TEXT, balance REAL, equity REAL, margin REAL, free_margin REAL, drawdown_percent REAL, open_positions INTEGER DEFAULT 0, last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN open_positions INTEGER DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN display_name TEXT DEFAULT ""')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN total_closed_pnl REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN total_closed_trades INTEGER DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN total_closed_lots REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN rebate_lots_total REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN rebate_total REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN rebate_rate REAL DEFAULT 10')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN peak_drawdown_amount REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN peak_drawdown_percent REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN account_currency TEXT DEFAULT "USD"')
    except: pass
    try: cursor.execute('ALTER TABLE accounts ADD COLUMN money_scale REAL DEFAULT 1')
    except: pass
    cursor.execute('''CREATE TABLE IF NOT EXISTS open_trades (id INTEGER PRIMARY KEY AUTOINCREMENT, account_number TEXT NOT NULL, ticket INTEGER UNIQUE NOT NULL, symbol TEXT, trade_type TEXT, lots REAL, open_price REAL, current_price REAL, profit REAL, last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (account_number) REFERENCES accounts(account_number))''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS daily_history (id INTEGER PRIMARY KEY AUTOINCREMENT, account_number TEXT NOT NULL, date TEXT NOT NULL, daily_profit REAL, daily_trades INTEGER, daily_lots REAL DEFAULT 0, last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(account_number, date), FOREIGN KEY (account_number) REFERENCES accounts(account_number))''')
    try: cursor.execute('ALTER TABLE daily_history ADD COLUMN daily_lots REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE daily_history ADD COLUMN daily_rebate_lots REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE daily_history ADD COLUMN daily_rebate REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE daily_history ADD COLUMN account_currency TEXT DEFAULT "USD"')
    except: pass
    try: cursor.execute('ALTER TABLE daily_history ADD COLUMN money_scale REAL DEFAULT 1')
    except: pass
    cursor.execute('''CREATE TABLE IF NOT EXISTS equity_snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, account_number TEXT NOT NULL, bucket_ts TEXT NOT NULL, balance REAL, equity REAL, floating REAL, drawdown_percent REAL DEFAULT 0, open_positions INTEGER DEFAULT 0, last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(account_number, bucket_ts), FOREIGN KEY (account_number) REFERENCES accounts(account_number))''')
    try: cursor.execute('ALTER TABLE equity_snapshots ADD COLUMN drawdown_percent REAL DEFAULT 0')
    except: pass
    try: cursor.execute('ALTER TABLE equity_snapshots ADD COLUMN account_currency TEXT DEFAULT "USD"')
    except: pass
    try: cursor.execute('ALTER TABLE equity_snapshots ADD COLUMN money_scale REAL DEFAULT 1')
    except: pass
    cursor.execute('''CREATE INDEX IF NOT EXISTS idx_equity_snapshots_bucket ON equity_snapshots(bucket_ts)''')
    conn.commit(); conn.close()


def minute_bucket(timestamp: datetime) -> str:
    return timestamp.astimezone(timezone.utc).replace(second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M:00Z")


def valid_history_date(value) -> str | None:
    candidate = str(value or "").strip()
    try:
        datetime.strptime(candidate, "%Y-%m-%d")
        return candidate
    except (TypeError, ValueError):
        return None


def normalize_account_currency(value) -> str:
    currency = str(value or "USD").strip().upper()
    if not currency:
        return "USD"
    if "USC" in currency or "CENT" in currency:
        return "USC"
    return currency


def default_money_scale(account_currency: str) -> float:
    return 100.0 if normalize_account_currency(account_currency) == "USC" else 1.0


def parse_money_scale(value, account_currency: str) -> float:
    try:
        scale = float(value)
        if scale > 0:
            return scale
    except (TypeError, ValueError):
        pass
    return default_money_scale(account_currency)


def parse_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def scaled_rebate_lots(raw_lots: float, money_scale: float) -> float:
    if money_scale and money_scale > 1:
        return raw_lots / money_scale
    return raw_lots


def resolve_rebate_lots(data, rebate_rate: float, rebate_total: float, money_scale: float) -> float:
    for key in ("rebate_lots_total", "total_rebate_lots", "rebate_lots"):
        if key in data and data.get(key) is not None:
            return parse_float(data.get(key), 0.0)
    raw_lots = parse_float(data.get("total_closed_lots"), 0.0)
    if raw_lots:
        return scaled_rebate_lots(raw_lots, money_scale)
    if rebate_rate:
        return scaled_rebate_lots(rebate_total / rebate_rate, money_scale)
    return 0.0


def resolve_daily_rebate_lots(row, rebate_rate: float, daily_rebate: float, money_scale: float) -> float:
    for key in ("daily_rebate_lots", "rebate_lots"):
        if key in row and row.get(key) is not None:
            return parse_float(row.get(key), 0.0)
    raw_lots = parse_float(row.get("daily_lots"), 0.0)
    if raw_lots:
        return scaled_rebate_lots(raw_lots, money_scale)
    if rebate_rate:
        return scaled_rebate_lots(daily_rebate / rebate_rate, money_scale)
    return 0.0


def resolve_account_money_settings(cursor, account_number, data) -> tuple[str, float]:
    currency_value = data.get('account_currency', data.get('currency', data.get('accountCurrency')))
    scale_value = data.get('money_scale', data.get('moneyScale'))
    has_money_fields = currency_value is not None or scale_value is not None
    if has_money_fields:
        account_currency = normalize_account_currency(currency_value)
        return account_currency, parse_money_scale(scale_value, account_currency)

    try:
        row = cursor.execute(
            'SELECT account_currency, money_scale FROM accounts WHERE account_number = ?',
            (str(account_number),)
        ).fetchone()
        if row:
            account_currency = normalize_account_currency(row[0])
            return account_currency, parse_money_scale(row[1], account_currency)
    except sqlite3.Error:
        pass

    return "USD", 1.0


def store_equity_snapshot(cursor, data, bucket_ts: str, open_positions: int, account_currency: str | None = None, money_scale: float | None = None):
    balance = float(data.get('balance', 0) or 0)
    equity = float(data.get('equity', 0) or 0)
    drawdown_percent = float(data.get('drawdown_percent', 0) or 0)
    if account_currency is None or money_scale is None:
        account_currency, money_scale = resolve_account_money_settings(cursor, data['account_number'], data)
    cursor.execute(
        '''INSERT INTO equity_snapshots (account_number, bucket_ts, balance, equity, floating, drawdown_percent, open_positions, account_currency, money_scale, last_update)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(account_number, bucket_ts) DO UPDATE SET
               balance = excluded.balance,
               equity = excluded.equity,
               floating = excluded.floating,
               drawdown_percent = excluded.drawdown_percent,
               open_positions = excluded.open_positions,
               account_currency = excluded.account_currency,
               money_scale = excluded.money_scale,
               last_update = CURRENT_TIMESTAMP''',
        (data['account_number'], bucket_ts, balance, equity, equity - balance, drawdown_percent, open_positions, account_currency, money_scale)
    )

async def monitor_api_keys():
    while True:
        for name, key in API_KEYS.items():
            clean_key = key.strip()
            is_groq = "GROQ" in name
            url = "https://api.groq.com/openai/v1/chat/completions" if is_groq else "https://api.deepseek.com/chat/completions"
            model = "llama-3.3-70b-versatile" if is_groq else "deepseek-chat"
            req = urllib.request.Request(url, method="POST")
            req.add_header("Authorization", f"Bearer {clean_key}")
            req.add_header("Content-Type", "application/json")
            req.add_header("Accept", "application/json")
            req.add_header("User-Agent", "OpenAI/v1 PythonBindings/1.12.0")
            data = json.dumps({"model": model, "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}).encode('utf-8')
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, lambda: urllib.request.urlopen(req, data=data, timeout=10))
                headers = dict((k.lower(), v) for k, v in response.getheaders())
                rem = headers.get('x-ratelimit-remaining-tokens', 'N/A')
                limit = headers.get('x-ratelimit-limit-tokens', '1')
                reset = headers.get('x-ratelimit-reset-tokens', 'N/A')
                if rem != 'N/A' and limit != '1' and float(limit) > 0:
                    pct = (float(rem) / float(limit)) * 100
                else:
                    pct = 100.0
                QUOTA_DATA[name] = {"status": "🟢 Active", "pct": round(pct, 2), "reset_time": reset.replace('s', ' sec') if 's' in reset else reset}
            except urllib.error.HTTPError as e:
                if e.code == 429: QUOTA_DATA[name] = {"status": "🔴 Exhausted", "pct": 0, "reset_time": "Wait Reset"}
                else: QUOTA_DATA[name] = {"status": f"🟡 Err {e.code}", "pct": 0, "reset_time": str(e.code)}
            except Exception as e: QUOTA_DATA[name] = {"status": "🔴 Offline", "pct": 0, "reset_time": "Timeout"}
            await asyncio.sleep(1.5)
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    init_db()
    if API_KEYS:
        asyncio.create_task(monitor_api_keys())


@app.post("/api/auth/login")
async def login(payload: LoginRequest, response: Response):
    username = payload.username.strip().lower()
    configured = AUTH_USERS.get(username)
    if not configured or not hmac.compare_digest(payload.password, configured["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_session_token(username, configured["role"])
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=SESSION_TTL_SECONDS,
        path="/",
    )
    return {"username": username, "role": configured["role"], "authenticated": True}


@app.get("/api/auth/me")
async def get_current_user(request: Request):
    try:
        user = require_user(request)
        user["authenticated"] = True
        return user
    except HTTPException:
        return {"authenticated": False}


@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"status": "success"}

@app.get("/api/system")
async def get_system_status(request: Request):
    require_admin(request)
    loop = asyncio.get_event_loop(); cpu_percent = await loop.run_in_executor(None, lambda: psutil.cpu_percent(interval=0.1))
    mem = psutil.virtual_memory(); disk = psutil.disk_usage('/')
    return { "cpu_percent": cpu_percent, "ram_percent": mem.percent, "disk_percent": disk.percent, "timestamp": datetime.now().isoformat() }


@app.get("/api/mt5/config")
async def get_mt5_config(request: Request):
    require_admin(request)
    return {"api_key": INGEST_API_KEY, "configured": bool(INGEST_API_KEY)}

# 🚀 อัปเกรดระบบอ่าน Log แบบดุดัน ไม่เกรงใจอักขระแปลกปลอม!
@app.get("/api/logs")
async def get_logs(request: Request):
    require_admin(request)
    if not os.path.exists(LOG_FILE_PATH):
        return {"logs": [f"⚠️ Waiting for TFM logs... (File not found)"]}
    try:
        file_size = os.path.getsize(LOG_FILE_PATH)
        if file_size == 0:
            return {"logs": ["⚠️ The log file exists, but it is currently EMPTY (0 bytes)."]}
        
        # errors="replace" จะบังคับอ่านไฟล์ให้ได้ ต่อให้มีตัวอักษรพังๆ ซ่อนอยู่
        with open(LOG_FILE_PATH, "r", encoding="utf-8", errors="replace") as f:
            # กรองบรรทัดที่ว่างเปล่าทิ้งไป เอาแต่เนื้อเน้นๆ
            lines = [line.strip() for line in f.readlines() if line.strip()]
            if not lines:
                return {"logs": [f"⚠️ File has size {file_size} bytes, but no readable text found."]}
            return {"logs": lines[-50:]}
            
    except Exception as e:
        return {"logs": [f"❌ Error reading log: {str(e)}"]}

@app.post("/api/mt5/update")
async def update_mt5_data(request: Request):
    """Endpoint สำหรับ mt5_data_collector.py"""
    require_ingest_key(request)
    try:
        body = await request.body(); data = json.loads(body.decode('utf-8').strip())
        conn = sqlite3.connect(str(DB_PATH)); cursor = conn.cursor()
        utc_tz = timezone.utc; now_utc = datetime.now(utc_tz)
        bucket_ts = minute_bucket(now_utc)
        reported_date = valid_history_date(data.get('reporting_date'))
        if reported_date:
            target_date = reported_date
            is_weekend = datetime.strptime(target_date, "%Y-%m-%d").weekday() in [5, 6]
        else:
            target_date = now_utc.strftime('%Y-%m-%d')
            if now_utc.weekday() == 5 and now_utc.hour < 6:
                target_date = (now_utc - timedelta(days=1)).strftime('%Y-%m-%d'); is_weekend = False
            elif now_utc.weekday() in [5, 6]: is_weekend = True
            else: is_weekend = False
        incoming_peak_amount = float(data.get('peak_drawdown_amount', 0) or 0)
        incoming_peak_percent = float(data.get('peak_drawdown_percent', data.get('drawdown_percent', 0)) or 0)
        rebate_rate = float(data.get('rebate_rate', data.get('rebate_per_lot', 10)) or 0)
        rebate_total = float(data.get('rebate_total', data.get('total_rebate', data.get('rebate', (float(data.get('total_closed_lots', 0) or 0) * rebate_rate)))) or 0)
        account_currency, money_scale = resolve_account_money_settings(cursor, data['account_number'], data)
        rebate_lots_total = resolve_rebate_lots(data, rebate_rate, rebate_total, money_scale)
        cursor.execute(
            '''INSERT INTO accounts (account_number, broker, balance, equity, margin, free_margin, drawdown_percent, open_positions, total_closed_pnl, total_closed_trades, total_closed_lots, rebate_lots_total, rebate_total, rebate_rate, peak_drawdown_amount, peak_drawdown_percent, account_currency, money_scale, last_update)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(account_number) DO UPDATE SET
                   broker = excluded.broker,
                   balance = excluded.balance,
                   equity = excluded.equity,
                   margin = excluded.margin,
                   free_margin = excluded.free_margin,
                   drawdown_percent = excluded.drawdown_percent,
                   open_positions = excluded.open_positions,
                   total_closed_pnl = excluded.total_closed_pnl,
                   total_closed_trades = excluded.total_closed_trades,
                   total_closed_lots = excluded.total_closed_lots,
                   rebate_lots_total = excluded.rebate_lots_total,
                   rebate_total = excluded.rebate_total,
                   rebate_rate = excluded.rebate_rate,
                   peak_drawdown_amount = MAX(COALESCE(accounts.peak_drawdown_amount, 0), excluded.peak_drawdown_amount),
                   peak_drawdown_percent = MAX(COALESCE(accounts.peak_drawdown_percent, 0), excluded.peak_drawdown_percent),
                   account_currency = excluded.account_currency,
                   money_scale = excluded.money_scale,
                   last_update = CURRENT_TIMESTAMP''',
            (data['account_number'], data.get('broker',''), data['balance'], data['equity'],
             data.get('margin', 0), data.get('free_margin', 0), data.get('drawdown_percent', 0),
             data.get('open_positions', 0), data.get('total_closed_pnl'),
             data.get('total_closed_trades'), data.get('total_closed_lots'), rebate_lots_total, rebate_total, rebate_rate,
             incoming_peak_amount, incoming_peak_percent, account_currency, money_scale)
        )
        store_equity_snapshot(cursor, data, bucket_ts, int(data.get('open_positions', 0) or 0), account_currency, money_scale)
        # บันทึก open_trades ถ้ามีส่งมา
        cursor.execute('DELETE FROM open_trades WHERE account_number = ?', (data['account_number'],))
        for trade in data.get('open_trades', []):
            cursor.execute(
                '''INSERT OR REPLACE INTO open_trades (account_number, ticket, symbol, trade_type, lots, open_price, current_price, profit, last_update)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)''',
                (data['account_number'], str(trade['ticket']), trade['symbol'], trade['trade_type'],
                 float(trade['lots']), trade['open_price'], trade.get('current_price', 0), trade['profit'])
            )
        for row in data.get('daily_history', []):
            if not isinstance(row, dict):
                continue
            history_date = valid_history_date(row.get('date'))
            if not history_date:
                continue
            row_daily_lots = float(row.get('daily_lots', 0) or 0)
            row_daily_rebate = float(row.get('daily_rebate', (row_daily_lots * rebate_rate)) or 0)
            row_daily_rebate_lots = resolve_daily_rebate_lots(row, rebate_rate, row_daily_rebate, money_scale)
            cursor.execute(
                '''INSERT OR REPLACE INTO daily_history (account_number, date, daily_profit, daily_trades, daily_lots, daily_rebate_lots, daily_rebate, account_currency, money_scale, last_update)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)''',
                (data['account_number'], history_date, float(row.get('daily_profit', 0) or 0),
                 int(row.get('daily_trades', 0) or 0), row_daily_lots, row_daily_rebate_lots,
                 row_daily_rebate, account_currency, money_scale)
            )
        if not is_weekend:
            today_lots = float(data.get('today_lots', 0) or 0)
            today_rebate = float(data.get('today_rebate', today_lots * rebate_rate) or 0)
            today_rebate_lots = resolve_daily_rebate_lots(
                {"daily_rebate_lots": data.get("today_rebate_lots"), "daily_lots": today_lots},
                rebate_rate,
                today_rebate,
                money_scale,
            )
            cursor.execute(
                '''INSERT OR REPLACE INTO daily_history (account_number, date, daily_profit, daily_trades, daily_lots, daily_rebate_lots, daily_rebate, account_currency, money_scale, last_update)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)''',
                (data['account_number'], target_date, data.get('today_pnl', 0), data.get('today_trades', 0), today_lots, today_rebate_lots, today_rebate, account_currency, money_scale)
            )
        conn.commit(); conn.close()
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/update")
async def update_data(request: Request):
    require_ingest_key(request)
    try:
        body = await request.body(); data = json.loads(body.decode('utf-8').strip())
        conn = sqlite3.connect(str(DB_PATH)); cursor = conn.cursor()
        bkk_tz = timezone(timedelta(hours=7)); now_bkk = datetime.now(bkk_tz)
        bucket_ts = minute_bucket(now_bkk)
        target_date = data.get('date', now_bkk.strftime('%Y-%m-%d'))
        if now_bkk.weekday() == 5 and now_bkk.hour < 6: target_date = (now_bkk - timedelta(days=1)).strftime('%Y-%m-%d'); is_weekend = False
        elif now_bkk.weekday() in [5, 6]: is_weekend = True
        else: is_weekend = False
        incoming_peak_amount = float(data.get('peak_drawdown_amount', 0) or 0)
        incoming_peak_percent = float(data.get('peak_drawdown_percent', data.get('drawdown_percent', 0)) or 0)
        rebate_rate = float(data.get('rebate_rate', data.get('rebate_per_lot', 10)) or 0)
        rebate_total = float(data.get('rebate_total', data.get('total_rebate', data.get('rebate', (float(data.get('total_closed_lots', 0) or 0) * rebate_rate)))) or 0)
        account_currency, money_scale = resolve_account_money_settings(cursor, data['account_number'], data)
        rebate_lots_total = resolve_rebate_lots(data, rebate_rate, rebate_total, money_scale)
        cursor.execute('''INSERT INTO accounts (account_number, broker, balance, equity, margin, free_margin, drawdown_percent, open_positions, total_closed_pnl, total_closed_trades, total_closed_lots, rebate_lots_total, rebate_total, rebate_rate, peak_drawdown_amount, peak_drawdown_percent, account_currency, money_scale, last_update)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                          ON CONFLICT(account_number) DO UPDATE SET
                              broker = excluded.broker,
                              balance = excluded.balance,
                              equity = excluded.equity,
                              margin = excluded.margin,
                              free_margin = excluded.free_margin,
                              drawdown_percent = excluded.drawdown_percent,
                              open_positions = excluded.open_positions,
                              total_closed_pnl = excluded.total_closed_pnl,
                              total_closed_trades = excluded.total_closed_trades,
                              total_closed_lots = excluded.total_closed_lots,
                              rebate_lots_total = excluded.rebate_lots_total,
                              rebate_total = excluded.rebate_total,
                              rebate_rate = excluded.rebate_rate,
                              peak_drawdown_amount = MAX(COALESCE(accounts.peak_drawdown_amount, 0), excluded.peak_drawdown_amount),
                              peak_drawdown_percent = MAX(COALESCE(accounts.peak_drawdown_percent, 0), excluded.peak_drawdown_percent),
                              account_currency = excluded.account_currency,
                              money_scale = excluded.money_scale,
                              last_update = CURRENT_TIMESTAMP''', (data['account_number'], data['broker'], data['balance'], data['equity'], data['margin'], data['free_margin'], data['drawdown_percent'], len(data.get('open_trades', [])), data.get('total_closed_pnl'), data.get('total_closed_trades'), data.get('total_closed_lots'), rebate_lots_total, rebate_total, rebate_rate, incoming_peak_amount, incoming_peak_percent, account_currency, money_scale))
        store_equity_snapshot(cursor, data, bucket_ts, len(data.get('open_trades', [])), account_currency, money_scale)
        cursor.execute('DELETE FROM open_trades WHERE account_number = ?', (data['account_number'],))
        for trade in data.get('open_trades', []): cursor.execute('''INSERT OR REPLACE INTO open_trades (account_number, ticket, symbol, trade_type, lots, open_price, current_price, profit, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)''', (data['account_number'], str(trade['ticket']), trade['symbol'], trade['trade_type'], float(trade['lots']), trade['open_price'], trade['current_price'], trade['profit']))
        if not is_weekend:
            daily_lots = float(data.get('daily_lots', data.get('today_lots', 0)) or 0)
            daily_rebate = float(data.get('daily_rebate', data.get('today_rebate', daily_lots * rebate_rate)) or 0)
            daily_rebate_lots = resolve_daily_rebate_lots(
                {"daily_rebate_lots": data.get("daily_rebate_lots", data.get("today_rebate_lots")), "daily_lots": daily_lots},
                rebate_rate,
                daily_rebate,
                money_scale,
            )
            cursor.execute('''INSERT OR REPLACE INTO daily_history (account_number, date, daily_profit, daily_trades, daily_lots, daily_rebate_lots, daily_rebate, account_currency, money_scale, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)''', (data['account_number'], target_date, data.get('daily_profit', 0), data.get('daily_trades', 0), daily_lots, daily_rebate_lots, daily_rebate, account_currency, money_scale))
        conn.commit(); conn.close(); return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard")
async def get_dashboard(request: Request):
    user = require_user(request)
    conn = sqlite3.connect(str(DB_PATH)); conn.row_factory = sqlite3.Row; cursor = conn.cursor()
    cursor.execute('SELECT * FROM accounts ORDER BY last_update DESC'); accounts = [dict(row) for row in cursor.fetchall()]
    cursor.execute('SELECT * FROM open_trades ORDER BY last_update DESC'); trades = [dict(row) for row in cursor.fetchall()]
    cursor.execute('SELECT * FROM daily_history ORDER BY date DESC'); history_rows = [dict(row) for row in cursor.fetchall()]
    cursor.execute('SELECT * FROM (SELECT account_number, bucket_ts, balance, equity, floating, drawdown_percent, open_positions, account_currency, money_scale FROM equity_snapshots ORDER BY bucket_ts DESC LIMIT 10000) ORDER BY bucket_ts ASC'); equity_snapshots = [dict(row) for row in cursor.fetchall()]
    conn.close(); trades_by_account = {}; history_by_account = {}
    for trade in trades: trades_by_account.setdefault(trade['account_number'], []).append(trade)
    for row in history_rows: history_by_account.setdefault(row['account_number'], []).append(row)
    for acc in accounts: acc['open_trades'] = trades_by_account.get(acc['account_number'], []); acc['daily_history'] = history_by_account.get(acc['account_number'], [])
    scale_by_account = {
        str(acc.get("account_number")): parse_money_scale(acc.get("money_scale"), acc.get("account_currency"))
        for acc in accounts
    }
    payload = {
        "accounts": accounts,
        "equity_snapshots": equity_snapshots,
        "quotas": QUOTA_DATA,
        "summary": {
            "total_equity": sum(float(acc.get('equity', 0) or 0) / scale_by_account.get(str(acc.get("account_number")), 1.0) for acc in accounts),
            "total_floating_profit": sum(float(trade.get('profit', 0) or 0) / scale_by_account.get(str(trade.get("account_number")), 1.0) for trade in trades),
            "total_accounts": len(accounts),
            "total_open_trades": len(trades)
        }
    }
    return sanitize_demo_dashboard(payload) if user.get("role") == "demo" else payload


@app.post("/api/accounts/{account_number}/name")
async def update_account_name(account_number: str, payload: AccountNameUpdate, request: Request):
    require_admin(request)
    display_name = payload.display_name.strip()[:80]
    conn = sqlite3.connect(str(DB_PATH)); conn.row_factory = sqlite3.Row; cursor = conn.cursor()
    cursor.execute('UPDATE accounts SET display_name = ? WHERE account_number = ?', (display_name, account_number))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")
    conn.commit()
    cursor.execute('SELECT account_number, display_name FROM accounts WHERE account_number = ?', (account_number,))
    row = dict(cursor.fetchone())
    conn.close()
    return row


@app.delete("/api/accounts/{account_number}")
async def delete_account(account_number: str, request: Request):
    require_admin(request)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    account = cursor.execute(
        "SELECT account_number, display_name, broker FROM accounts WHERE account_number = ?",
        (account_number,),
    ).fetchone()
    if account is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")

    backup_dir = DB_PATH.parent / "deleted-account-backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    safe_account = re.sub(r"[^A-Za-z0-9_-]+", "_", account_number)[:80] or "account"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup_path = backup_dir / f"before-delete-{safe_account}-{timestamp}.db"

    backup_conn = sqlite3.connect(str(backup_path))
    try:
        conn.backup(backup_conn)
    finally:
        backup_conn.close()

    try:
        cursor.execute("BEGIN IMMEDIATE")
        deleted = {}
        for table in ("open_trades", "daily_history", "equity_snapshots"):
            cursor.execute(f"DELETE FROM {table} WHERE account_number = ?", (account_number,))
            deleted[table] = cursor.rowcount
        cursor.execute("DELETE FROM accounts WHERE account_number = ?", (account_number,))
        deleted["accounts"] = cursor.rowcount
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return {
        "status": "deleted",
        "account_number": account_number,
        "display_name": account["display_name"],
        "broker": account["broker"],
        "deleted": deleted,
        "backup": backup_path.name,
        "warning": "Disable the MT5 Reporter for this account or it will be added again on the next update.",
    }
