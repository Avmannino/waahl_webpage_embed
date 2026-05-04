function doGet() {
  var url = "https://wingsarena.ezleagues.ezfacility.com/leagues/477108/SpringSummer-2026-Wings-Arena-Adult-Hockey-League.aspx";

  try {
    var response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    var status = response.getResponseCode();
    var html = response.getContentText();

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: status >= 200 && status < 300,
        status: status,
        source: url,
        fetchedAt: new Date().toISOString(),
        htmlLength: html ? html.length : 0,
        html: html
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        source: url,
        fetchedAt: new Date().toISOString(),
        error: String(err)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
