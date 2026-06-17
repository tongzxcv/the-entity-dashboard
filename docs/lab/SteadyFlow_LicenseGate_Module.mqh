// Prototype only. Do not copy into production EA without lab validation.
// Target EA inspected:
// D:\EA\SteadyFlow_ForwardPackage_TH100k_R678\MQL5\Experts\SteadyFlow V1.4 X10 TH.mq5
//
// Integration points:
// - Add inputs below near existing license inputs.
// - Call LicenseGate_Init() from OnInit().
// - Add EventSetTimer(InpLicenseCheckIntervalSeconds) in OnInit().
// - Call LicenseGate_OnTimer() from OnTimer().
// - Gate only new entry logic with LicenseGate_AllowsNewEntries().
// - Do not block SafeClosePosition(), basket close, or emergency close paths.

input bool   InpUseWebLicenseGate = false;
input string InpLicenseCheckUrl = "http://<dashboard-host>/api/ea/license/check";
input string InpEaLicenseToken = "";
input int    InpLicenseCheckIntervalSeconds = 60;
input int    InpLicenseLastKnownTtlSeconds = 1800;

bool     g_licenseAllowNewEntries = false;
bool     g_licenseAllowManageExisting = true;
bool     g_licenseAllowCloseExisting = true;
datetime g_licenseLastApprovedAt = 0;
datetime g_licenseLastCheckAt = 0;
string   g_licenseStatus = "LOCAL_ONLY";
string   g_licenseMessage = "";

string LicenseGate_JsonEscape(string value)
{
   StringReplace(value, "\\", "\\\\");
   StringReplace(value, "\"", "\\\"");
   return value;
}

bool LicenseGate_AllowsNewEntries()
{
   if(!InpUseWebLicenseGate)
      return true;
   if(g_licenseAllowNewEntries)
      return true;
   if(g_licenseLastApprovedAt > 0 && (TimeCurrent() - g_licenseLastApprovedAt) <= InpLicenseLastKnownTtlSeconds)
      return true;
   return false;
}

bool LicenseGate_AllowsCloseExisting()
{
   if(!InpUseWebLicenseGate)
      return true;
   return g_licenseAllowCloseExisting;
}

void LicenseGate_ApplyResponse(const string response)
{
   g_licenseAllowNewEntries = (StringFind(response, "\"allow_new_entries\":true") >= 0);
   g_licenseAllowManageExisting = (StringFind(response, "\"allow_manage_existing\":true") >= 0);
   g_licenseAllowCloseExisting = (StringFind(response, "\"allow_close_existing\":true") >= 0);
   if(g_licenseAllowNewEntries)
      g_licenseLastApprovedAt = TimeCurrent();
   g_licenseStatus = "CHECKED";
   g_licenseMessage = response;
}

bool LicenseGate_Check()
{
   if(!InpUseWebLicenseGate)
      return true;
   if(StringLen(InpEaLicenseToken) < 12)
   {
      g_licenseAllowNewEntries = false;
      g_licenseStatus = "TOKEN_MISSING";
      g_licenseMessage = "EA license token missing";
      return false;
   }

   string body = "{";
   body += "\"account_login\":\"" + IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   body += "\"broker_server\":\"" + LicenseGate_JsonEscape(AccountInfoString(ACCOUNT_SERVER)) + "\",";
   body += "\"symbol\":\"" + LicenseGate_JsonEscape(_Symbol) + "\",";
   body += "\"ea_name\":\"SteadyFlow\",";
   body += "\"ea_version\":\"V1.4 X10 TH\",";
   body += "\"magic\":\"" + IntegerToString(InpMagicNumber) + "\",";
   body += "\"build_hash\":\"\",";
   body += "\"machine_id\":\"" + LicenseGate_JsonEscape(TerminalInfoString(TERMINAL_DATA_PATH)) + "\",";
   body += "\"timestamp\":\"" + TimeToString(TimeGMT(), TIME_DATE|TIME_SECONDS) + "\"";
   body += "}";

   uchar post[];
   StringToCharArray(body, post, 0, StringLen(body), CP_UTF8);
   uchar result[];
   string resultHeaders = "";
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + InpEaLicenseToken + "\r\n";
   ResetLastError();
   int status = WebRequest("POST", InpLicenseCheckUrl, headers, 8000, post, result, resultHeaders);
   g_licenseLastCheckAt = TimeCurrent();
   if(status != 200)
   {
      g_licenseAllowNewEntries = false;
      g_licenseStatus = "HTTP_" + IntegerToString(status);
      g_licenseMessage = "license check failed, error=" + IntegerToString(GetLastError());
      return false;
   }

   string response = CharArrayToString(result, 0, -1, CP_UTF8);
   LicenseGate_ApplyResponse(response);
   return g_licenseAllowNewEntries;
}

void LicenseGate_Init()
{
   if(!InpUseWebLicenseGate)
      return;
   LicenseGate_Check();
   EventSetTimer(MathMax(30, InpLicenseCheckIntervalSeconds));
}

void LicenseGate_OnTimer()
{
   if(!InpUseWebLicenseGate)
      return;
   LicenseGate_Check();
}
