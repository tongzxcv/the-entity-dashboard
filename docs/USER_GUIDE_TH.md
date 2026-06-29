# The Entity Dashboard - คู่มือใช้งานภาษาไทย

อัปเดตล่าสุด: 2026-06-29

คู่มือนี้ใช้สำหรับดูแลเว็บ The Entity Dashboard, ตั้งค่า MT5 Reporter, จัดการบัญชี IB/License Gate และตรวจ production หลัง deploy

> ข้อสำคัญ: ห้ามบันทึก admin password, agent token, API key, SSH key หรือ MT5 password ลงใน repo, preset, เอกสาร, log หรือ screenshot ที่จะแชร์ให้คนอื่น

## 1. สถานะระบบตอนนี้

ระบบหลักของเว็บพร้อมใช้งานแล้ว:

- เว็บ monitor พอร์ต EA ผ่าน MT5 Reporter
- แยกสิทธิ์ `admin` / `demo`
- Demo ถูกซ่อนข้อมูลสำคัญ เช่น ticket, open price, account id บางส่วน, Reporter, System Health และเมนู admin
- License Gate พร้อมใช้เป็นระบบอนุมัติบัญชี MT5 ก่อนให้ EA เปิดไม้ใหม่
- Status ของ License Gate เหลือ 3 ตัว: `APPROVED`, `PAUSED`, `BLOCKED`
- Agent token สร้างจากหน้าเว็บได้ และแสดง token จริงครั้งเดียวตอนสร้าง
- Audit log เก็บประวัติการเปลี่ยนสถานะบัญชีและ license check

## 2. สิ่งที่ยังเหลือทำ

รายการที่ควรทำต่อ เรียงตามความสำคัญ:

| ลำดับ | งาน | เหตุผล |
|---:|---|---|
| 1 | Runtime QA และ promote EA production ทีละตัว | เว็บพร้อมแล้ว แต่ EA แต่ละตัวต้องพิสูจน์ว่า License Gate ไม่กระทบ logic เทรดเดิม |
| 2 | เพิ่มบัญชีจริงใน `IB Accounts` แล้ว approve เฉพาะบัญชีที่อนุญาต | เว็บต้องเป็น source of truth ของบัญชีที่ใช้ EA ได้ |
| 3 | ตั้ง policy การสร้าง/หมุน Agent Token | ลดความเสี่ยงถ้า token หลุด |
| 4 | ทำ backup/restore database ก่อนเพิ่มบัญชีจำนวนมาก | ป้องกันข้อมูล registry/audit หาย |
| 5 | ตั้ง domain + HTTPS ถ้ายังใช้ IP ตรง | เหมาะสำหรับใช้งานจริงและแชร์ให้ investor |
| 6 | เพิ่ม workflow สมาชิก/แพ็กเกจ ถ้าจะขายเป็น SaaS | แยกจาก License Gate ได้ ไม่ควรรีบทำจนระบบหลักไม่นิ่ง |
| 7 | เพิ่ม alert channel เช่น Telegram/LINE | แจ้งเตือน reporter offline, DD สูง, account ถูก block |
| 8 | เพิ่ม HMAC/replay protection ให้ license check ถ้าต้องการ hardening สูงขึ้น | ตอนนี้ bearer token เพียงพอสำหรับเฟสใช้งานภายใน แต่ HMAC แข็งกว่า |

ตอนนี้ไม่ควรเพิ่มระบบสั่งเทรดจากเว็บ เว็บควรเป็น monitor + license/account gate เท่านั้น

## 3. การเข้าใช้งาน

เว็บ production:

```text
http://161.118.245.238:3000
```

บัญชี:

- `admin`: ใช้สำหรับจัดการระบบทั้งหมด รหัสผ่านให้เก็บใน password manager หรือ secret store เท่านั้น
- `demo`: ใช้สำหรับให้คนอื่นดู dashboard แบบซ่อนข้อมูลสำคัญ

อย่าใส่ admin password ลงในคู่มือ, GitHub, preset, log หรือข้อความแชทที่จะแชร์ต่อ

## 4. สิทธิ์ Admin และ Demo

| ความสามารถ | Admin | Demo |
|---|---:|---:|
| ดู Overview / Expert Advisors / Symbols / Trades / Preview / History | yes | yes |
| เห็น ticket / open price / account id เต็ม | yes | no |
| กด Sync / Auto sync | yes | no |
| เข้า MT5 Reporter | yes | no |
| เข้า System Health | yes | no |
| เข้า IB Accounts / License Gate | yes | no |
| สร้าง Agent Token | yes | no |
| Export CSV | yes | no |
| ดู/แก้ Account Registry | yes | no |

## 5. หน้า Overview

ใช้ดูสถานะรวมของพอร์ต:

- `Operational Brief`: สรุปสิ่งที่ต้องดูทันที เช่น portfolio status, floating risk, weekend exposure
- KPI cards: balance, floating P/L, monthly/weekly/today P/L, active EAs, open trades
- Equity curve: กราฟ equity รวม
- EA performance / heatmap / monthly summary: ใช้ดูผลงานย้อนหลัง

ถ้าเห็นตัวเลขผิดปกติ ให้เช็คตามลำดับ:

1. MT5 Reporter ยังส่งข้อมูลอยู่หรือไม่
2. Account เป็น USD หรือ cent/USC
3. Period filter ถูกต้องหรือไม่
4. มีบัญชีเก่าค้างใน registry หรือ reporter data หรือไม่

## 6. หน้า Expert Advisors

ใช้ดูแต่ละ EA/บัญชี:

- Balance / Equity
- Peak DD
- Floating
- Today P&L
- Today rebate ถ้ามีข้อมูล rebate
- Open lots
- Risk badge ตาม DD:
  - `0% - 10%`: Low Risk
  - `10.01% - 30%`: Medium Risk
  - `30.01% - 50%`: High Risk
  - `> 50%`: Extreme Risk

Admin สามารถแก้ชื่อ EA หรือชื่อตั้งเองของบัญชีได้จากปุ่มแก้ไขบน card

## 7. หน้า Symbols

ใช้ดู exposure ตาม symbol เช่น XAUUSD:

- Open trades
- Total lots
- Buy / Sell split
- Floating P&L
- Exposure table

ถ้าตัวเลขติดลบยาวมาก ระบบควรแสดงในช่องได้โดยไม่ล้น layout หากเจอล้นอีกให้ capture หน้าจอพร้อม viewport แล้วแก้ CSS เฉพาะจุด

## 8. หน้า Active Trades

ใช้ดู order ที่เปิดอยู่:

- Admin เห็นข้อมูลเต็ม เช่น ticket, open price, lots, P&L
- Demo เห็นข้อมูลแบบ sanitize เช่น Trade 1, Trade 2 และไม่เห็น open price/ticket จริง

ถ้าต้องเช็คความเสี่ยงก่อนปิดตลาดวันศุกร์ ให้ดู:

1. จำนวน open trades
2. Open lots
3. Floating P&L
4. EA ที่มี basket เปิดอยู่

## 9. หน้า MT5 Preview

ใช้ดูภาพรวมข้อมูลจาก MT5 Reporter แบบใกล้เคียง terminal:

- Group ตาม account/EA
- เห็น status, equity, floating, trades
- ใช้เช็คว่า reporter ส่งข้อมูลถูก account หรือไม่

หากบัญชีที่ attach EA แล้วไม่ขึ้น:

1. เช็ค WebRequest allow-list ใน MT5
2. เช็ค endpoint URL
3. เช็ค API key ของ reporter
4. เช็คว่า Algo Trading เปิดอยู่
5. เช็ค Expert log ใน MT5

## 10. หน้า History

ใช้ดูประวัติ order ที่ปิดแล้ว:

- Filter ตามช่วงเวลา
- ดู P&L, lots, closed deals
- Admin export CSV ได้
- Demo ไม่ควร export ข้อมูลดิบ

ถ้าเลือก Custom period แล้วตัวเลขไม่เปลี่ยน ให้เช็คว่าเลือกทั้ง start date และ end date ครบ

## 11. หน้า IB Accounts / License Gate

หน้า `IB Accounts` ใช้แทนระบบอนุมัติเลขบัญชีผ่าน Google Sheet

### 11.1 Status

| Status | เปิดไม้ใหม่ | Manage/Close order เดิม | ใช้เมื่อ |
|---|---:|---:|---|
| `APPROVED` | yes | yes | บัญชีผ่านอนุมัติ เทรดได้ตามปกติ |
| `PAUSED` | no | yes | หยุดชั่วคราว เช่น ข่าว, รอตรวจ, ไม่อยากให้เปิดไม้ใหม่ |
| `BLOCKED` | no | yes | ไม่อนุญาต, หมดสิทธิ์, suspended, expired, ผิดเงื่อนไข |

ทั้ง `PAUSED` และ `BLOCKED` ต้องไม่เปิด order ใหม่ แต่ต้องยังให้ EA จัดการหรือปิด basket เดิมได้

### 11.2 เพิ่มบัญชี

1. เข้า `IB Accounts`
2. กดเพิ่มบัญชี
3. ใส่ข้อมูลหลัก:
   - `account_login`
   - `broker_name`
   - `broker_server`
   - `account_type`: เช่น `cent`, `standard`, `demo`, `live`
   - `symbol`: เช่น `XAUUSD.c`, `XAUUSD`
   - `allowed EA`: เลือก preset หรือใส่ชื่อ EA เอง
   - `risk_profile`
4. ตั้ง status เริ่มต้นเป็น `PAUSED`
5. ใส่ reason ทุกครั้งที่เปลี่ยน status
6. กด `Approve` เมื่อพร้อมให้บัญชีเปิดไม้ใหม่ได้

### 11.3 ลบบัญชีออกจาก Registry

การลบในหน้านี้ลบเฉพาะบัญชีออกจาก License Gate approval เท่านั้น ไม่ใช่ลบประวัติ portfolio/trade ทั้งหมด

ขั้นตอน:

1. เปิดบัญชีที่ต้องการลบ
2. กด delete
3. พิมพ์ `account_login` เพื่อยืนยัน
4. ยืนยันการลบ

ถ้าแค่ไม่อยากให้เปิดไม้ใหม่ ให้ใช้ `PAUSED` หรือ `BLOCKED` แทนการลบ

### 11.4 Audit history

ใช้ดูว่า:

- ใคร approve/pause/block
- เวลาใด
- reason คืออะไร
- old status -> new status
- license check ล่าสุดมาจาก EA/version/symbol/machine ใด

## 12. Agent Tokens

Agent token คือ token ที่ EA/Agent ใช้เรียก:

```text
POST /api/ea/license/check
```

หลักการ:

- สร้าง token จากหน้า `IB Accounts`
- Token จริงแสดงครั้งเดียวตอนสร้าง
- หลังจากนั้นเว็บเก็บเฉพาะ hash
- ถ้าลืมหรือหลุด ให้ revoke แล้วสร้างใหม่
- ห้าม commit token ลง repo
- ห้ามใส่ token ในเอกสารหรือ screenshot

เมื่อแจก EA ให้คนอื่น:

- แจกไฟล์ EA ที่ compile แล้ว
- ให้ user เพิ่ม URL ใน MT5 WebRequest allow-list
- เลขบัญชีของ user จะถูกตรวจจากเว็บ
- Admin approve/pause/block เลขบัญชีจากเว็บ
- ไม่ต้องขอ MT5 password หรือ investor password

## 13. MT5 Reporter Setup

หน้า `MT5 Reporter` จะแสดง endpoint และ API key สำหรับ reporter

ค่าหลัก:

```text
Endpoint URL:
http://161.118.245.238:3000/api/mt5/update

WebRequest Allow-list:
http://161.118.245.238:3000
```

ขั้นตอนใน MT5:

1. เปิด MT5
2. ไปที่ `Tools -> Options -> Expert Advisors`
3. เปิด `Allow WebRequest for listed URL`
4. เพิ่ม URL:

```text
http://161.118.245.238:3000
```

5. เปิด `Allow algorithmic trading`
6. Attach MT5 Reporter หรือ EA ที่มี reporter module กับ chart
7. ใส่ `DashboardEndpoint`
8. ใส่ `DashboardApiKey` จากหน้า admin เท่านั้น
9. ดู `Last Reporter Sync` ในเว็บ

ถ้าข้อมูลไม่ขึ้น:

- URL ใน WebRequest ต้องตรง scheme/host/port
- API key ต้องถูก
- AutoTrading ต้องเปิด
- Reporter ต้อง attach อยู่จริง
- VPS firewall ต้องไม่บล็อก outbound HTTP

## 14. License Check API สำหรับ EA/Agent

Endpoint:

```text
POST /api/ea/license/check
```

Header:

```http
Authorization: Bearer <agent-token>
```

Request ตัวอย่าง:

```json
{
  "account_login": "97075178",
  "broker_server": "InterStellarFinancial-Server",
  "symbol": "XAUUSD.c",
  "ea_name": "SteadyFlow",
  "ea_version": "V1.4 X10 TH",
  "magic": 56789,
  "build_hash": "",
  "machine_id": "",
  "timestamp": ""
}
```

Response `APPROVED`:

```json
{
  "status": "APPROVED",
  "allow_new_entries": true,
  "allow_manage_existing": true,
  "allow_close_existing": true,
  "message": "approved",
  "check_interval_seconds": 60
}
```

Response `PAUSED` หรือ `BLOCKED`:

```json
{
  "status": "PAUSED",
  "allow_new_entries": false,
  "allow_manage_existing": true,
  "allow_close_existing": true,
  "message": "account paused by admin: reason",
  "check_interval_seconds": 30
}
```

EA ต้องใช้ผลนี้เพื่อ block เฉพาะการเปิด order ใหม่ ห้าม block close/manage order เดิม

## 15. คำสั่ง QA / Build / Production Regression

เปิด PowerShell:

```powershell
cd D:\TONG\Bot\the-entity-dashboard
npm run test:ui-all
npm run build
```

Production regression:

```powershell
cd D:\TONG\Bot\the-entity-dashboard
$env:BASE_URL="http://161.118.245.238:3000"
$env:QA_ADMIN_PASSWORD="<admin password from secret store>"
npm run qa:production
Remove-Item Env:\QA_ADMIN_PASSWORD -ErrorAction SilentlyContinue
```

License Gate production E2E:

```powershell
cd D:\TONG\Bot\the-entity-dashboard
$env:QA_ADMIN_PASSWORD="<admin password from secret store>"
$env:EA_LICENSE_API_TOKEN="<agent token from admin UI>"
npm run qa:license-gate-production
Remove-Item Env:\QA_ADMIN_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:\EA_LICENSE_API_TOKEN -ErrorAction SilentlyContinue
```

## 16. Deploy checklist แบบสั้น

ก่อน deploy:

1. `npm run test:ui-all`
2. `npm run build`
3. ถ้าแก้ License Gate ให้รัน `npm run test:license-gate`
4. ตรวจว่าไม่มี secret ใน diff
5. Commit เฉพาะไฟล์ที่เกี่ยวข้อง
6. Deploy `dist`
7. Restart service/proxy
8. รัน `npm run qa:production`
9. ถ้าแก้ License Gate ให้รัน `npm run qa:license-gate-production`

ดู checklist เต็มได้ที่:

```text
docs/DEPLOY_CHECKLIST.md
```

## 17. Troubleshooting

### Login admin ไม่ผ่าน

- เช็ค `ADMIN_PASSWORD` บน VPS
- อย่าใช้ password จากเอกสารเก่า
- รัน production QA ด้วย env var ชั่วคราวเท่านั้น

### Demo เห็นเมนู admin

ถือเป็น bug ด้าน permission ต้องหยุด deploy และแก้ก่อนใช้งาน investor/demo

### EA ได้ `PAUSED` ทั้งที่ควร approved

เช็ค:

1. `account_login` ตรงไหม
2. `broker_server` ตรงกับ MT5 ไหม
3. บัญชีใน `IB Accounts` status เป็น `APPROVED` หรือไม่
4. Token ถูก revoke หรือไม่
5. EA ส่ง symbol/version/magic ตรงกับ policy หรือไม่

### EA เปิด order ทั้งที่ `PAUSED` หรือ `BLOCKED`

ถือเป็น blocker ของ EA integration ห้าม promote EA production ต้องกลับไป Runtime QA

### ข้อมูลเงิน cent/USC ดูเหมือนผิด

Cent account อาจรายงานเงินคนละหน่วยกับ USD ปกติ ต้องดู currency/account type และใช้ `¢` เมื่อเป็นพอร์ต cent ตาม policy ของระบบ

### ปุ่ม copy ไม่ทำงาน

เช็ค browser permission และดู console ถ้าปุ่ม copy ในหน้า MT5 Reporter ไม่ copy ข้อความ ให้แก้ UI handler ก่อน deploy เพราะเป็น workflow สำคัญตอน setup MT5

## 18. กฎความปลอดภัยที่ต้องจำ

- เว็บห้ามเก็บ MT5 trade password หรือ investor password
- เว็บเฟสนี้ห้ามส่งคำสั่งเทรด
- License Gate คุมเฉพาะสิทธิ์เปิด order ใหม่
- `PAUSED/BLOCKED` ยังต้องปล่อยให้ EA manage/close order เดิมได้
- Token ต้องสร้าง/หมุนจากหน้า admin และ revoke ได้
- Production EA ต้องผ่าน lab/runtime QA ก่อนแจกหรือใช้งานจริง
