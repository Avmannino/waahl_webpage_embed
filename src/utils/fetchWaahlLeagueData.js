import { parseEzLeaguesPageHtml } from "./parseEzLeaguesPage";

const PREMIER_URL =
  "https://wingsarena.ezleagues.ezfacility.com/leagues/479627/Fall--Winter-2026-AB.aspx";

const LEGENDS_URL =
  "https://wingsarena.ezleagues.ezfacility.com/leagues/480515/(Copy)-Fall--Winter-2026-Legends-League.aspx";

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

// The Premier EZLeagues page has incorrect playoff dates/times/matchups, so
// its playoff rows are replaced with this manually maintained bracket.
// Remove once the EZLeagues page is corrected.
const PREMIER_PLAYOFF_SCHEDULE = [
  { date: "Tue-Dec 1", time: "10:00 PM", home: "Seed 4", away: "Seed 5", gameType: "Play-in Playoff" },
  { date: "Tue-Dec 8", time: "10:00 PM", home: "Seed 2", away: "Seed 3", gameType: "Playoff" },
  { date: "Wed-Dec 9", time: "9:45 PM", home: "Seed 1", away: "Winner Seed 4/5", gameType: "Playoff" },
  { date: "Tue-Dec 15", time: "10:00 PM", home: "Semifinal Winner", away: "Semifinal Winner", gameType: "Playoff" },
  { date: "Sat-Dec 19", time: "8:30 PM", home: "Final", away: "Final", gameType: "Playoff" },
].map((g) => ({ ...g, rink: "Wings Arena", status: "Scheduled", score: "" }));

const PLAYOFF_PLACEHOLDER_TEAM = /\b(seed|finals?|winner)\b/i;

function isPlayoffRow(row) {
  return (
    /postseason|playoff/i.test(row.gameType) ||
    PLAYOFF_PLACEHOLDER_TEAM.test(row.home) ||
    PLAYOFF_PLACEHOLDER_TEAM.test(row.away)
  );
}

function applyPremierPlayoffOverride(division) {
  return {
    ...division,
    schedule: [
      ...division.schedule.filter((row) => !isPlayoffRow(row)),
      ...PREMIER_PLAYOFF_SCHEDULE,
    ],
  };
}

function buildResult(premierHtml, legendsHtml) {
  return {
    premier: applyPremierPlayoffOverride(parseEzLeaguesPageHtml(premierHtml)),
    legends: parseEzLeaguesPageHtml(legendsHtml),
    parsedAt: new Date().toISOString(),
  };
}

export { PREMIER_URL, LEGENDS_URL };
