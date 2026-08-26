import { parseEzLeaguesPageHtml } from "./parseEzLeaguesPage";

const PREMIER_URL =
  "https://wingsarena.ezleagues.ezfacility.com/leagues/479627/Fall--Winter-2026-AB.aspx";

const LEGENDS_URL =
  "https://wingsarena.ezleagues.ezfacility.com/leagues/479649/Fall--Winter-2026-Legends-League.aspx";

export async function fetchWaahlLeagueData() {
  const configuredProxy = import.meta.env.VITE_EZLEAGUES_PROXY_URL?.trim();
  const isDev = import.meta.env.DEV;

  if (configuredProxy) {
    return fetchAndParseViaProxy(configuredProxy);
  }

  if (isDev) {
    return fetchAndParseDirect("/api/ezleagues-premier", "/api/ezleagues-legends");
  }

  return fetchAndParseDirect(PREMIER_URL, LEGENDS_URL);
}

async function fetchText(url) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}) for ${url}`);
  }

  const text = await res.text();

  if (!text) {
    throw new Error(`Empty response received from ${url}`);
  }

  return text;
}

async function fetchAndParseDirect(premierUrl, legendsUrl) {
  const [premierHtml, legendsHtml] = await Promise.all([
    fetchText(premierUrl),
    fetchText(legendsUrl),
  ]);

  return buildResult(premierHtml, legendsHtml);
}

async function fetchAndParseViaProxy(proxyUrl) {
  const rawText = await fetchText(proxyUrl);

  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    const preview = rawText.slice(0, 180).replace(/\s+/g, " ");
    throw new Error(
      `Proxy did not return JSON. Response starts with: ${preview}`
    );
  }

  const premierHtml = json.premier?.html || "";
  const legendsHtml = json.legends?.html || "";

  if (!premierHtml || !legendsHtml) {
    throw new Error(
      "Proxy JSON did not include the expected 'premier'/'legends' html fields."
    );
  }

  return buildResult(premierHtml, legendsHtml);
}

function buildResult(premierHtml, legendsHtml) {
  return {
    premier: parseEzLeaguesPageHtml(premierHtml),
    legends: parseEzLeaguesPageHtml(legendsHtml),
    parsedAt: new Date().toISOString(),
  };
}

export { PREMIER_URL, LEGENDS_URL };
