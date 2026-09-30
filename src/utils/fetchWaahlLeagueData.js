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

// Folded team's forfeit games are hidden from the Premier schedule.
const FORFEIT_TEAM = /\bfold\b/i;

// Correct home/away for games the EZLeagues page lists reversed. Rows already
// in this orientation are left alone, so this is safe if the page gets fixed.
const PREMIER_HOME_AWAY = [
  { date: "Tue-Sep 29", home: "AQR", away: "Steak Tips" },
  { date: "Wed-Sep 30", home: "Rockies", away: "The Whalers" },
  { date: "Sun-Oct 4", home: "The Whalers", away: "AQR" },
  { date: "Tue-Oct 6", home: "Nature Boys", away: "The Whalers" },
  { date: "Wed-Oct 7", home: "AQR", away: "Rockies" },
  { date: "Wed-Oct 14", home: "Steak Tips", away: "AQR" },
  { date: "Wed-Oct 21", home: "Rockies", away: "AQR" },
  { date: "Tue-Oct 27", home: "Nature Boys", away: "Rockies" },
  { date: "Tue-Nov 10", home: "AQR", away: "The Whalers" },
  { date: "Wed-Nov 11", home: "Nature Boys", away: "Steak Tips" },
  { date: "Sun-Nov 15", home: "The Whalers", away: "Nature Boys" },
  { date: "Tue-Nov 17", home: "The Whalers", away: "Rockies" },
  { date: "Sun-Nov 22", home: "Rockies", away: "AQR" },
];

function swapScore(score) {
  const m = score.match(/^(\d+) - (\d+)(.*)$/);
  return m ? `${m[2]} - ${m[1]}${m[3]}` : score;
}

function fixHomeAway(row) {
  const fix = PREMIER_HOME_AWAY.find(
    (f) => f.date === row.date && f.home === row.away && f.away === row.home
  );
  if (!fix) return row;

  const score = swapScore(row.score);
  return {
    ...row,
    home: row.away,
    away: row.home,
    score,
    status: row.score ? row.status.replace(row.score, score) : row.status,
  };
}

function applyPremierScheduleOverrides(division) {
  return {
    ...division,
    schedule: [
      ...division.schedule
        .filter((row) => !isPlayoffRow(row))
        .filter((row) => !FORFEIT_TEAM.test(row.home) && !FORFEIT_TEAM.test(row.away))
        .map(fixHomeAway),
      ...PREMIER_PLAYOFF_SCHEDULE,
    ],
  };
}

function buildResult(premierHtml, legendsHtml) {
  return {
    premier: applyPremierScheduleOverrides(parseEzLeaguesPageHtml(premierHtml)),
    legends: parseEzLeaguesPageHtml(legendsHtml),
    parsedAt: new Date().toISOString(),
  };
}

export { PREMIER_URL, LEGENDS_URL };
