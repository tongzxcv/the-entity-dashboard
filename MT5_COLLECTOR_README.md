# MT5 Dashboard Reporter

Copy `MT5DashboardReporter.mq5` into an MT5 terminal under `MQL5/Experts`, compile it in MetaEditor, then attach it to one chart per account that should report to the dashboard.

Required MT5 setting:

1. Open `Tools > Options > Expert Advisors`.
2. Enable `Allow WebRequest for listed URL`.
3. Add `http://161.118.245.238:3000`.

Recommended inputs:

- `DashboardEndpoint`: `http://161.118.245.238:3000/api/mt5/update`
- `DashboardApiKey`: use the server `INGEST_API_KEY` value from `/home/ubuntu/forex-ea-dashboard/.env`
- `PushIntervalSeconds`: `30`
- `IncludeAllSymbols`: `true`
- `IncludeDailyHistory`: `true`
- `HistoryLookbackDays`: `365`
- `HistoryPushIntervalMinutes`: `60`
- `EnableReporter`: `true`

Reporter v1.04 also sends closed-deal daily history for backfill. The first successful sync after installing v1.04 restores up to `HistoryLookbackDays` days; later history backfills run every `HistoryPushIntervalMinutes`.

The reporter only reads and sends account metrics, history, and open position snapshots. It does not trade or modify positions.
