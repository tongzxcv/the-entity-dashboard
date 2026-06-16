#property strict
#property version   "1.06"
#property description "Posts MT5 account, open-position, and closed-deal snapshots to the Forex EA dashboard."

input string DashboardEndpoint = "http://161.118.245.238:3000/api/mt5/update";
input string DashboardApiKey = "";
input int    PushIntervalSeconds = 30;
input bool   IncludeAllSymbols = true;
input bool   IncludeDailyHistory = true;
input int    HistoryLookbackDays = 365;
input int    HistoryPushIntervalMinutes = 60;
input double RebatePerLotUsd = 10.0;
input double RebateLotMultiplier = 0.0;
input string AccountCurrencyOverride = "";
input bool   EnableReporter = true;

datetime last_push = 0;
datetime last_history_push = 0;

struct DailyHistoryStat
{
   string date;
   double pnl;
   int trades;
   double lots;
};

string PeakKey(string suffix)
{
   return "MT5DashboardReporter_" + suffix + "_" + IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN));
}

string JsonEscape(string value)
{
   StringReplace(value, "\\", "\\\\");
   StringReplace(value, "\"", "\\\"");
   StringReplace(value, "\r", "\\r");
   StringReplace(value, "\n", "\\n");
   return value;
}

string NormalizeAccountCurrency(string value)
{
   string currency = value;
   StringTrimLeft(currency);
   StringTrimRight(currency);
   StringToUpper(currency);
   if(currency == "")
      currency = "USD";
   if(StringFind(currency, "USC") >= 0 || StringFind(currency, "CENT") >= 0)
      return "USC";
   return currency;
}

double MoneyScaleForCurrency(string currency)
{
   if(NormalizeAccountCurrency(currency) == "USC")
      return 100.0;
   return 1.0;
}

double EffectiveRebateLotMultiplier(double money_scale)
{
   if(RebateLotMultiplier > 0.0)
      return RebateLotMultiplier;
   if(money_scale > 1.0)
      return 1.0 / money_scale;
   return 1.0;
}

string PositionTypeName(long type)
{
   if(type == POSITION_TYPE_BUY) return "BUY";
   if(type == POSITION_TYPE_SELL) return "SELL";
   return "UNKNOWN";
}

string DateKey(datetime value)
{
   MqlDateTime parts;
   TimeToStruct(value, parts);
   return StringFormat("%04d-%02d-%02d", parts.year, parts.mon, parts.day);
}

int FindDailyHistoryStat(DailyHistoryStat &stats[], string key)
{
   for(int i = 0; i < ArraySize(stats); i++)
   {
      if(stats[i].date == key)
         return i;
   }
   return -1;
}

string BuildDailyHistoryJson(int lookback_days, double rebate_lot_multiplier)
{
   if(lookback_days <= 0)
      return "[]";

   datetime now = TimeCurrent();
   datetime from_time = now - (datetime)((long)lookback_days * 86400);
   ResetLastError();
   if(!HistorySelect(from_time, now))
   {
      PrintFormat("MT5DashboardReporter: HistorySelect backfill failed. last_error=%d", GetLastError());
      return "[]";
   }

   DailyHistoryStat stats[];
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0)
         continue;

      long deal_type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(deal_type != DEAL_TYPE_BUY && deal_type != DEAL_TYPE_SELL)
         continue;

      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY && entry != DEAL_ENTRY_INOUT)
         continue;

      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      if(!IncludeAllSymbols && symbol != _Symbol)
         continue;

      string key = DateKey((datetime)HistoryDealGetInteger(ticket, DEAL_TIME));
      int index = FindDailyHistoryStat(stats, key);
      if(index < 0)
      {
         index = ArraySize(stats);
         ArrayResize(stats, index + 1);
         stats[index].date = key;
         stats[index].pnl = 0.0;
         stats[index].trades = 0;
         stats[index].lots = 0.0;
      }

      stats[index].pnl += HistoryDealGetDouble(ticket, DEAL_PROFIT);
      stats[index].pnl += HistoryDealGetDouble(ticket, DEAL_SWAP);
      stats[index].pnl += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      stats[index].lots += HistoryDealGetDouble(ticket, DEAL_VOLUME);
      stats[index].trades++;
   }

   string json = "[";
   for(int i = 0; i < ArraySize(stats); i++)
   {
      if(i > 0)
         json += ",";
      json += "{";
      json += "\"date\":\"" + stats[i].date + "\",";
      json += "\"daily_profit\":" + DoubleToString(stats[i].pnl, 2) + ",";
      json += "\"daily_trades\":" + IntegerToString(stats[i].trades) + ",";
      double rebate_lots = stats[i].lots * rebate_lot_multiplier;
      json += "\"daily_lots\":" + DoubleToString(stats[i].lots, 2) + ",";
      json += "\"daily_rebate_lots\":" + DoubleToString(rebate_lots, 4) + ",";
      json += "\"daily_rebate\":" + DoubleToString(rebate_lots * RebatePerLotUsd, 2);
      json += "}";
   }
   json += "]";
   return json;
}

void GetTodayClosedStats(double &today_pnl, int &today_trades, double &today_lots)
{
   today_pnl = 0.0;
   today_trades = 0;
   today_lots = 0.0;

   datetime now = TimeCurrent();
   MqlDateTime day;
   TimeToStruct(now, day);
   day.hour = 0;
   day.min = 0;
   day.sec = 0;
   datetime day_start = StructToTime(day);

   ResetLastError();
   if(!HistorySelect(day_start, now))
   {
      PrintFormat("MT5DashboardReporter: HistorySelect failed. last_error=%d", GetLastError());
      return;
   }

   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0)
         continue;

      long deal_type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(deal_type != DEAL_TYPE_BUY && deal_type != DEAL_TYPE_SELL)
         continue;

      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY && entry != DEAL_ENTRY_INOUT)
         continue;

      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      if(!IncludeAllSymbols && symbol != _Symbol)
         continue;

      today_pnl += HistoryDealGetDouble(ticket, DEAL_PROFIT);
      today_pnl += HistoryDealGetDouble(ticket, DEAL_SWAP);
      today_pnl += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      today_lots += HistoryDealGetDouble(ticket, DEAL_VOLUME);
      today_trades++;
   }
}

void GetClosedStats(datetime from_time, datetime to_time, double &closed_pnl, int &closed_trades, double &closed_lots)
{
   closed_pnl = 0.0;
   closed_trades = 0;
   closed_lots = 0.0;

   ResetLastError();
   if(!HistorySelect(from_time, to_time))
   {
      PrintFormat("MT5DashboardReporter: HistorySelect total failed. last_error=%d", GetLastError());
      return;
   }

   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0)
         continue;

      long deal_type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(deal_type != DEAL_TYPE_BUY && deal_type != DEAL_TYPE_SELL)
         continue;

      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY && entry != DEAL_ENTRY_INOUT)
         continue;

      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      if(!IncludeAllSymbols && symbol != _Symbol)
         continue;

      closed_pnl += HistoryDealGetDouble(ticket, DEAL_PROFIT);
      closed_pnl += HistoryDealGetDouble(ticket, DEAL_SWAP);
      closed_pnl += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      closed_lots += HistoryDealGetDouble(ticket, DEAL_VOLUME);
      closed_trades++;
   }
}

void UpdatePeakDrawdown(double balance, double equity, double current_dd_percent, double &peak_dd_amount, double &peak_dd_percent)
{
   double current_dd_amount = 0.0;
   if(equity < balance)
      current_dd_amount = balance - equity;

   string amount_key = PeakKey("PeakDDAmount");
   string percent_key = PeakKey("PeakDDPercent");
   peak_dd_amount = GlobalVariableCheck(amount_key) ? GlobalVariableGet(amount_key) : 0.0;
   peak_dd_percent = GlobalVariableCheck(percent_key) ? GlobalVariableGet(percent_key) : 0.0;

   if(current_dd_amount > peak_dd_amount)
   {
      peak_dd_amount = current_dd_amount;
      GlobalVariableSet(amount_key, peak_dd_amount);
   }

   if(current_dd_percent > peak_dd_percent)
   {
      peak_dd_percent = current_dd_percent;
      GlobalVariableSet(percent_key, peak_dd_percent);
   }
}

string BuildPayload(bool include_history)
{
   string account_number = IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN));
   string broker = AccountInfoString(ACCOUNT_COMPANY);
   string account_currency = AccountCurrencyOverride;
   if(account_currency == "")
      account_currency = AccountInfoString(ACCOUNT_CURRENCY);
   account_currency = NormalizeAccountCurrency(account_currency);
   double money_scale = MoneyScaleForCurrency(account_currency);
   double rebate_lot_multiplier = EffectiveRebateLotMultiplier(money_scale);
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin = AccountInfoDouble(ACCOUNT_MARGIN);
   double free_margin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double drawdown = 0.0;

   if(balance > 0.0 && equity < balance)
      drawdown = ((balance - equity) / balance) * 100.0;

   string trades = "[";
   int included = 0;
   int total = PositionsTotal();

   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0 || !PositionSelectByTicket(ticket))
         continue;

      string symbol = PositionGetString(POSITION_SYMBOL);
      if(!IncludeAllSymbols && symbol != _Symbol)
         continue;

      if(included > 0)
         trades += ",";

      trades += "{";
      trades += "\"ticket\":" + IntegerToString((long)ticket) + ",";
      trades += "\"symbol\":\"" + JsonEscape(symbol) + "\",";
      trades += "\"trade_type\":\"" + PositionTypeName(PositionGetInteger(POSITION_TYPE)) + "\",";
      trades += "\"lots\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
      trades += "\"open_price\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS)) + ",";
      trades += "\"current_price\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_CURRENT), (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS)) + ",";
      trades += "\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2);
      trades += "}";
      included++;
   }

   trades += "]";

   double today_pnl = 0.0;
   int today_trades = 0;
   double today_lots = 0.0;
   GetTodayClosedStats(today_pnl, today_trades, today_lots);
   double today_rebate_lots = today_lots * rebate_lot_multiplier;
   double today_rebate = today_rebate_lots * RebatePerLotUsd;

   double total_closed_pnl = 0.0;
   int total_closed_trades = 0;
   double total_closed_lots = 0.0;
   GetClosedStats(0, TimeCurrent(), total_closed_pnl, total_closed_trades, total_closed_lots);
   double total_rebate_lots = total_closed_lots * rebate_lot_multiplier;
   double total_rebate = total_rebate_lots * RebatePerLotUsd;

   double peak_dd_amount = 0.0;
   double peak_dd_percent = 0.0;
   UpdatePeakDrawdown(balance, equity, drawdown, peak_dd_amount, peak_dd_percent);

   string payload = "{";
   payload += "\"account_number\":\"" + JsonEscape(account_number) + "\",";
   payload += "\"broker\":\"" + JsonEscape(broker) + "\",";
   payload += "\"account_currency\":\"" + JsonEscape(account_currency) + "\",";
   payload += "\"money_scale\":" + DoubleToString(money_scale, 2) + ",";
   payload += "\"balance\":" + DoubleToString(balance, 2) + ",";
   payload += "\"equity\":" + DoubleToString(equity, 2) + ",";
   payload += "\"margin\":" + DoubleToString(margin, 2) + ",";
   payload += "\"free_margin\":" + DoubleToString(free_margin, 2) + ",";
   payload += "\"drawdown_percent\":" + DoubleToString(drawdown, 2) + ",";
   payload += "\"open_positions\":" + IntegerToString(included) + ",";
   payload += "\"open_trades\":" + trades + ",";
   payload += "\"today_pnl\":" + DoubleToString(today_pnl, 2) + ",";
   payload += "\"today_trades\":" + IntegerToString(today_trades) + ",";
   payload += "\"today_lots\":" + DoubleToString(today_lots, 2) + ",";
   payload += "\"today_rebate_lots\":" + DoubleToString(today_rebate_lots, 4) + ",";
   payload += "\"today_rebate\":" + DoubleToString(today_rebate, 2) + ",";
   payload += "\"total_closed_pnl\":" + DoubleToString(total_closed_pnl, 2) + ",";
   payload += "\"total_closed_trades\":" + IntegerToString(total_closed_trades) + ",";
   payload += "\"total_closed_lots\":" + DoubleToString(total_closed_lots, 2) + ",";
   payload += "\"total_rebate_lots\":" + DoubleToString(total_rebate_lots, 4) + ",";
   payload += "\"rebate_rate\":" + DoubleToString(RebatePerLotUsd, 2) + ",";
   payload += "\"rebate_lot_multiplier\":" + DoubleToString(rebate_lot_multiplier, 6) + ",";
   payload += "\"rebate_total\":" + DoubleToString(total_rebate, 2) + ",";
   payload += "\"peak_drawdown_amount\":" + DoubleToString(peak_dd_amount, 2) + ",";
   payload += "\"peak_drawdown_percent\":" + DoubleToString(peak_dd_percent, 2) + ",";
   payload += "\"reporting_date\":\"" + DateKey(TimeCurrent()) + "\"";
   if(include_history)
      payload += ",\"daily_history\":" + BuildDailyHistoryJson(HistoryLookbackDays, rebate_lot_multiplier);
   payload += "}";

   return payload;
}

bool PostSnapshot()
{
   if(!EnableReporter)
      return false;

   if(DashboardEndpoint == "" || DashboardApiKey == "")
   {
      Print("MT5DashboardReporter: DashboardEndpoint and DashboardApiKey are required.");
      return false;
   }

   bool include_history = IncludeDailyHistory &&
      (last_history_push == 0 || TimeCurrent() - last_history_push >= MathMax(1, HistoryPushIntervalMinutes) * 60);
   string payload = BuildPayload(include_history);
   char body[];
   int body_size = StringToCharArray(payload, body, 0, WHOLE_ARRAY, CP_UTF8);
   if(body_size > 0)
      ArrayResize(body, body_size - 1);

   char result[];
   string result_headers = "";
   string headers = "Content-Type: application/json\r\nX-API-Key: " + DashboardApiKey + "\r\n";

   ResetLastError();
   int status = WebRequest("POST", DashboardEndpoint, headers, 10000, body, result, result_headers);
   if(status < 200 || status >= 300)
   {
      PrintFormat("MT5DashboardReporter: POST failed. status=%d last_error=%d response=%s", status, GetLastError(), CharArrayToString(result));
      return false;
   }

   if(include_history)
      last_history_push = TimeCurrent();
   PrintFormat("MT5DashboardReporter: snapshot posted. status=%d account=%I64d positions=%d", status, AccountInfoInteger(ACCOUNT_LOGIN), PositionsTotal());
   return true;
}

int OnInit()
{
   EventSetTimer(MathMax(5, PushIntervalSeconds));
   PostSnapshot();
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTimer()
{
   if(TimeCurrent() - last_push < PushIntervalSeconds)
      return;

   if(PostSnapshot())
      last_push = TimeCurrent();
}

void OnTick()
{
   if(TimeCurrent() - last_push >= PushIntervalSeconds)
   {
      if(PostSnapshot())
         last_push = TimeCurrent();
   }
}
