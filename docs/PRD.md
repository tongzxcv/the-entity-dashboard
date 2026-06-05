Project: The Entity Forex EA Portfolio Monitoring Dashboard

Test the live production web app:
http://161.118.245.238:3000/

Roles:
1. Demo user:
username: demo
password: demo

Demo must be investor-safe:
- Must not see Sync button, Auto sync, MT5 Reporter, System Health, API keys, server CPU/RAM/Disk, or destructive controls.
- Must not see real ticket numbers or open prices in trade views.
- Must not see Export CSV if it exposes detailed trade/account data.

2. Admin user:
username: admin
password: configured via ADMIN_PASSWORD environment variable

Admin can see operational controls:
- Sync, Auto sync, MT5 Reporter, System Health, API/reporting setup, broker/account management.
- Admin may see delete portfolio controls, but tests must not submit destructive delete actions.
- Do not type DELETE into any confirmation dialog.
- Do not confirm account/portfolio deletion.

Core pages to test:
- Login
- Overview
- Expert Advisors
- EA detail panel
- Symbols
- Active Trades
- MT5 Preview
- History
- MT5 Reporter admin only
- System Health admin only

Desktop and mobile:
- Test desktop around 1440px wide.
- Test mobile around 390x844.
- No horizontal clipping or overflow.
- Mobile drawer must cover content cleanly and close correctly.
- Bottom navigation must fit mobile width.

Important flows:
- Login as demo and verify restricted navigation.
- Login as admin and verify admin-only pages exist.
- Open Expert Advisors and select an EA card.
- Verify Daily, Weekly, Monthly P&L bar charts show percentage labels and tooltips.
- Open Symbols and verify long negative Floating P&L values fit inside cards/tables.
- Open Active Trades and verify demo privacy masking.
- Open Custom Period and verify it shows Custom/select dates state correctly.
- Verify console errors and network 4xx/5xx errors are zero.

Acceptance criteria:
- No role-permission leaks.
- No destructive action executed.
- No visible mobile clipping.
- No broken buttons.
- No console errors.
- No network 4xx/5xx errors during normal navigation.
