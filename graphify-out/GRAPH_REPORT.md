# Graph Report - .  (2026-06-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 151 nodes · 292 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `AccountDrilldown()` - 17 edges
2. `MT5TerminalCard()` - 15 edges
3. `Request` - 12 edges
4. `fmtS()` - 11 edges
5. `OverviewPage()` - 10 edges
6. `str` - 8 edges
7. `dateKey()` - 8 edges
8. `require_admin()` - 7 edges
9. `update_mt5_data()` - 7 edges
10. `numericField()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `require_ingest_key()` --references--> `Request`  [EXTRACTED]
  backend_main.py → backend_main.py  _Bridges community 6 → community 5_
- `update_account_name()` --references--> `Request`  [EXTRACTED]
  backend_main.py → backend_main.py  _Bridges community 5 → community 4_
- `read_session()` --calls--> `_b64url()`  [EXTRACTED]
  backend_main.py → backend_main.py  _Bridges community 8 → community 5_
- `minute_bucket()` --references--> `str`  [EXTRACTED]
  backend_main.py → backend_main.py  _Bridges community 8 → community 6_
- `update_account_name()` --references--> `str`  [EXTRACTED]
  backend_main.py → backend_main.py  _Bridges community 8 → community 4_

## Import Cycles
- 1-file cycle: `backend_main.py -> backend_main.py`

## Communities (14 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (3): C, Ico, PERIOD_OPTIONS

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (26): accountClosedLots(), accountClosedProfit(), accountClosedTrades(), AccountDrilldown(), accountLabel(), accountMaxDrawdown(), AccountNameDialog(), accountOpenLots() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (16): dependencies, axios, playwright-core, react, react-dom, recharts, devDependencies, vite (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (15): buildAccountPeriodStats(), buildMonthlyRows(), buildPeriodStats(), buildRebateSummary(), collectHistory(), collectPeriodHistory(), dateKey(), fmtM() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.26
Nodes (10): AccountNameUpdate, init_db(), login(), LoginRequest, logout(), monitor_api_keys(), startup_event(), update_account_name() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.38
Nodes (10): get_current_user(), get_dashboard(), get_logs(), get_mt5_config(), get_system_status(), read_session(), require_admin(), require_user() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.28
Nodes (9): minute_bucket(), Endpoint สำหรับ mt5_data_collector.py, require_ingest_key(), store_equity_snapshot(), update_data(), update_mt5_data(), valid_history_date(), datetime (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (8): AlertsPage(), AttentionRequired(), buildAlerts(), buildRiskRows(), buildWeekendExposure(), pclr(), RiskDeskPage(), WeekendExposureCard()

### Community 8 - "Community 8"
Cohesion: 0.38
Nodes (7): _b64url(), _b64url_decode(), create_session_token(), env_flag(), bool, bytes, str

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (6): Backend Service, forex-ea-dashboard-backend Image, Frontend Distribution, nginx:1.27-alpine Image, Nginx Configuration, Reverse Proxy Service

### Community 10 - "Community 10"
Cohesion: 0.40
Nodes (5): fmtS(), HistoryPage(), PeriodCard(), SymbolsPage(), TradesPage()

## Knowledge Gaps
- **22 isolated node(s):** `int`, `name`, `version`, `type`, `dev` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccountDrilldown()` connect `Community 1` to `Community 0`, `Community 10`, `Community 3`, `Community 7`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `update_mt5_data()` connect `Community 6` to `Community 4`, `Community 5`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `int`, `Endpoint สำหรับ mt5_data_collector.py`, `name` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._