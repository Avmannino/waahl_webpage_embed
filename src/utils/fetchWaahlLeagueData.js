import { parseEzLeaguesPageHtml } from "./parseEzLeaguesPage";

const EZLEAGUES_URL =
  "https://wingsarena.ezleagues.ezfacility.com/leagues/472793/WinterSpring-26-Wings-Arena-Adult-Hockey-League.aspx";

export async function fetchWaahlLeagueData() {
  const configuredProxy = import.meta.env.VITE_EZLEAGUES_PROXY_URL?.trim();
  const isDev = import.meta.env.DEV;

  if (configuredProxy) {
    return fetchAndParse(configuredProxy, { expectProxyJson: true });
  }

  if (isDev) {
    return fetchAndParse("/api/ezleagues", { expectProxyJson: false });
  }

  return fetchAndParse(EZLEAGUES_URL, { expectProxyJson: false });
}

async function fetchAndParse(url, { expectProxyJson = false } = {}) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}) for ${url}`);
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const rawText = await res.text();

  if (!rawText) {
    throw new Error(`Empty response received from ${url}`);
  }

  let html = "";

  // If we expect JSON (Apps Script proxy), parse it safely
  if (expectProxyJson) {
    try {
      const json = JSON.parse(rawText);
      html = json.html || "";

      if (!html) {
        throw new Error("Proxy JSON did not include an 'html' field.");
      }
    } catch (err) {
      // Helpful debugging message when Google returns an HTML page instead of JSON
      const preview = rawText.slice(0, 180).replace(/\s+/g, " ");
      throw new Error(
        `Proxy did not return JSON. Received ${contentType || "unknown content-type"} instead. ` +
          `Response starts with: ${preview}`
      );
    }
  } else {
    // Non-proxy response (Vite proxy / direct)
    html = rawText;
  }

  return parseEzLeaguesPageHtml(html);
}

export { EZLEAGUES_URL };