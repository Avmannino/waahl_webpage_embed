function doGet() {
  var sources = {
    premier: "https://wingsarena.ezleagues.ezfacility.com/leagues/479627/Fall--Winter-2026-AB.aspx",
    legends: "https://wingsarena.ezleagues.ezfacility.com/leagues/479649/Fall--Winter-2026-Legends-League.aspx"
  };

  var result = {
    ok: true,
    fetchedAt: new Date().toISOString()
  };

  for (var key in sources) {
    var url = sources[key];

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
      var ok = status >= 200 && status < 300;

      result[key] = {
        ok: ok,
        status: status,
        source: url,
        htmlLength: html ? html.length : 0,
        html: html
      };

      if (!ok) result.ok = false;
    } catch (err) {
      result[key] = {
        ok: false,
        source: url,
        error: String(err)
      };
      result.ok = false;
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
