// Google Apps Script proxy for WAAHL EZLeagues data
// Deploy as: Execute as "Me", Access "Anyone"
// After deploying, paste the web app URL into .env.production as VITE_EZLEAGUES_PROXY_URL

var EZ_URL =
  "https://wingsarena.ezleagues.ezfacility.com/leagues/477108/SpringSummer-2026-Wings-Arena-Adult-Hockey-League.aspx";

function doGet(e) {
  try {
    var response = UrlFetchApp.fetch(EZ_URL, {
      method: "GET",
      followRedirects: true,
      muteHttpExceptions: true,
    });

    var html = response.getContentText("UTF-8");

    return ContentService.createTextOutput(JSON.stringify({ html: html })).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
