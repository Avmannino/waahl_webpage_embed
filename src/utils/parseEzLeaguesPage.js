// src/utils/parseEzLeaguesPage.js

function cleanText(str = "") {
  return String(str)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toInt(value, fallback = 0) {
  const n = parseInt(String(value).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(value, fallback = 0) {
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function extractDoc(htmlString) {
  try {
    return new DOMParser().parseFromString(htmlString, "text/html");
  } catch {
    return null;
  }
}

function getRowsFromTables(doc) {
  if (!doc) return [];
  const tables = Array.from(doc.querySelectorAll("table"));
  const allRows = [];

  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.querySelectorAll("th, td")).map((cell) => cleanText(cell.textContent))
    );
    if (rows.length) allRows.push(rows);
  }

  return allRows;
}

function parseStandingsFromTableRows(allTables) {
  // We look for a table with headers like GP/W/L/T/GF/GA/PTS/GD/WP
  for (const tableRows of allTables) {
    const headerRow = tableRows.find((r) =>
      r.some((c) => /^gp$/i.test(c)) &&
      r.some((c) => /^w$/i.test(c)) &&
      r.some((c) => /^l$/i.test(c)) &&
      r.some((c) => /^gf$/i.test(c)) &&
      r.some((c) => /^ga$/i.test(c))
    );

    if (!headerRow) continue;

    const rows = [];
    const headerIndex = tableRows.indexOf(headerRow);

    for (let i = headerIndex + 1; i < tableRows.length; i++) {
      const r = tableRows[i];
      if (!r || r.length < 6) continue;

      // Try to detect standings row patterns
      // Usually: Team | GP | W | L | T | GF | GA | PTS | GD | WP
      // Sometimes first column can be rank or hidden cells depending on markup.
      let team = "";
      let gp, w, l, t, gf, ga, pts, gd, wp;

      // Case A: exactly-ish expected shape
      // Find a candidate numeric run near the end and treat preceding text as team.
      // We'll parse from the right.
      const rowText = r.join(" ").trim();
      if (!rowText) continue;

      // Skip non-team rows
      if (/standings|schedule|calendar sync/i.test(rowText)) continue;

      // Build from raw cell array first
      const cells = [...r].filter(Boolean);

      // Common exact format: [Team, GP, W, L, T, GF, GA, PTS, GD, WP]
      if (
        cells.length >= 10 &&
        /^\d+$/.test(cells[cells.length - 2] || "") || /^-?\d+$/.test(cells[cells.length - 2] || "")
      ) {
        // Try exact from rightmost columns
        wp = toFloat(cells[cells.length - 1], NaN);
        gd = toInt(cells[cells.length - 2], NaN);
        pts = toInt(cells[cells.length - 3], NaN);
        ga = toInt(cells[cells.length - 4], NaN);
        gf = toInt(cells[cells.length - 5], NaN);
        t  = toInt(cells[cells.length - 6], NaN);
        l  = toInt(cells[cells.length - 7], NaN);
        w  = toInt(cells[cells.length - 8], NaN);
        gp = toInt(cells[cells.length - 9], NaN);
        team = cleanText(cells.slice(0, cells.length - 9).join(" "));
      }

      // Case B: PTS/GD combined in one token like "6-6" (from texty rows)
      if (!team || !Number.isFinite(gp) || !Number.isFinite(wp)) {
        const parsed = parseStandingsLineFallback(rowText);
        if (parsed) {
          rows.push(parsed);
          continue;
        }
      } else {
        if (!team) continue;
        if (!Number.isFinite(gp) || !Number.isFinite(w) || !Number.isFinite(l)) continue;

        rows.push({
          team,
          gp,
          w,
          l,
          t: Number.isFinite(t) ? t : 0,
          gf: Number.isFinite(gf) ? gf : 0,
          ga: Number.isFinite(ga) ? ga : 0,
          pts: Number.isFinite(pts) ? pts : 0,
          gd: Number.isFinite(gd) ? gd : 0,
          wp: Number.isFinite(wp) ? wp : 0,
        });
      }
    }

    if (rows.length) {
      return finalizeStandings(rows);
    }
  }

  return [];
}

// Fallback for text-style row parsing (handles "6-6" combined PTS/GD)
function parseStandingsLineFallback(line) {
  const txt = cleanText(line);
  if (!txt) return null;

  // Must end in WP
  const wpMatch = txt.match(/(-?\d+(?:\.\d+)?)$/);
  if (!wpMatch) return null;
  const wp = toFloat(wpMatch[1], NaN);
  if (!Number.isFinite(wp)) return null;

  let rest = cleanText(txt.slice(0, wpMatch.index));

  const tokens = rest.split(" ");
  if (tokens.length < 8) return null;

  let gd = 0;
  let pts = 0;

  // Last token may be GD or combined PTS/GD like "6-6"
  let last = tokens.pop();
  const combo = String(last).match(/^(\d+)([+-]\d+)$/);
  if (combo) {
    pts = toInt(combo[1], 0);
    gd = toInt(combo[2], 0);
  } else {
    gd = toInt(last, NaN);
    if (tokens.length === 0) return null;
    pts = toInt(tokens.pop(), NaN);
  }

  if (tokens.length < 6) return null;

  const ga = toInt(tokens.pop(), NaN);
  const gf = toInt(tokens.pop(), NaN);
  const t  = toInt(tokens.pop(), NaN);
  const l  = toInt(tokens.pop(), NaN);
  const w  = toInt(tokens.pop(), NaN);
  const gp = toInt(tokens.pop(), NaN);
  const team = cleanText(tokens.join(" "));

  if (!team) return null;
  if ([gp, w, l, t, gf, ga, pts, gd].some((n) => !Number.isFinite(n))) return null;

  return { team, gp, w, l, t, gf, ga, pts, gd, wp };
}

function finalizeStandings(rows) {
  const seen = new Set();
  const deduped = rows.filter((r) => {
    const key = `${r.team}|${r.gp}|${r.w}|${r.l}|${r.t}|${r.gf}|${r.ga}|${r.pts}|${r.gd}|${r.wp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => (b.pts - a.pts) || (b.gd - a.gd) || (b.gf - a.gf));

  return deduped.map((r, i) => ({ rank: i + 1, ...r }));
}

function parseScheduleFromTableRows(allTables) {
  for (const tableRows of allTables) {
    const headerRow = tableRows.find((r) =>
      r.some((c) => /date/i.test(c)) &&
      (r.some((c) => /home/i.test(c)) || r.some((c) => /team/i.test(c))) &&
      (r.some((c) => /time/i.test(c)) || r.some((c) => /venue/i.test(c)))
    );

    if (!headerRow) continue;

    const rows = [];
    const headerIndex = tableRows.indexOf(headerRow);

    for (let i = headerIndex + 1; i < tableRows.length; i++) {
      const cells = (tableRows[i] || []).filter(Boolean);
      if (!cells.length) continue;

      const rowText = cleanText(cells.join(" "));
      if (!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)-[A-Za-z]{3}\s+\d{1,2}\b/.test(rowText)) continue;

      const parsed = parseScheduleLineFallback(rowText);
      if (parsed) rows.push(parsed);
    }

    if (rows.length) return rows;
  }

  return [];
}

function parseScheduleLineFallback(line) {
  const txt = cleanText(line);

  const dateMatch = txt.match(/^((Mon|Tue|Wed|Thu|Fri|Sat|Sun)-[A-Za-z]{3}\s+\d{1,2})\s+(.*)$/);
  if (!dateMatch) return null;

  const date = dateMatch[1];
  let rest = cleanText(dateMatch[3]);

  let rink = "Wings Arena";
  let gameType = "";
  const tail = rest.match(/\b(Wings Arena)\s+(Regular|Postseason)\s*$/i);
  if (tail) {
    rink = cleanText(tail[1]);
    gameType = cleanText(tail[2]);
    rest = cleanText(rest.slice(0, tail.index));
  }

  let time = "TBD";
  let status = "Scheduled";

  if (/\bResult Pending$/i.test(rest)) {
    status = "Result Pending";
    rest = cleanText(rest.replace(/\bResult Pending$/i, ""));
  } else if (/\bComplete$/i.test(rest)) {
    status = "Complete";
    time = "Final";
    rest = cleanText(rest.replace(/\bComplete$/i, ""));
  } else {
    const timeMatch = rest.match(/(\d{1,2}:\d{2}\s*[AP]M)$/i);
    if (timeMatch) {
      time = cleanText(timeMatch[1]);
      rest = cleanText(rest.slice(0, timeMatch.index));
    }
  }

  let home = "";
  let away = "";
  let score = "";

  const vsMatch = rest.match(/^(.*?)\s+v\s+(.*?)$/i);
  if (vsMatch) {
    home = cleanText(vsMatch[1]);
    away = cleanText(vsMatch[2]);
  } else {
    const scoreMatch = rest.match(/^(.*?)\s+(\d+)\s*-\s*(\d+)(?:\s+OT)?\s+(.*?)$/i);
    if (scoreMatch) {
      home = cleanText(scoreMatch[1]);
      away = cleanText(scoreMatch[4]);
      score = `${scoreMatch[2]} - ${scoreMatch[3]}${/\sOT\s/i.test(rest) ? " OT" : ""}`;
      if (status === "Scheduled") status = "Complete";
      time = "Final";
    }
  }

  if (!home || !away) return null;

  return {
    date,
    time,
    home,
    away,
    rink,
    gameType,
    status: score && status === "Complete" ? `Complete (${score})` : status,
    score,
  };
}

function parseFromRawText(htmlString) {
  // fallback if table selectors fail
  let text = "";
  try {
    const doc = new DOMParser().parseFromString(htmlString, "text/html");
    text = doc.body?.innerText || doc.body?.textContent || htmlString;
  } catch {
    text = htmlString;
  }

  const lines = String(text)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const standings = [];
  const schedule = [];

  for (const line of lines) {
    const s = parseStandingsLineFallback(line);
    if (s) standings.push(s);

    if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)-[A-Za-z]{3}\s+\d{1,2}\b/.test(line)) {
      const g = parseScheduleLineFallback(line);
      if (g) schedule.push(g);
    }
  }

  return {
    standings: finalizeStandings(standings),
    schedule,
  };
}

export function parseEzLeaguesPageHtml(htmlString) {
  const doc = extractDoc(htmlString);
  const allTables = getRowsFromTables(doc);

  let standings = parseStandingsFromTableRows(allTables);
  let schedule = parseScheduleFromTableRows(allTables);

  // Fallback to raw text parsing if table parsing doesn't find rows
  if (!standings.length || !schedule.length) {
    const fallback = parseFromRawText(htmlString);
    if (!standings.length) standings = fallback.standings;
    if (!schedule.length) schedule = fallback.schedule;
  }

  // Debug logs (helpful while you test)
  console.log("[EZ Parser] tables found:", allTables.length);
  console.log("[EZ Parser] standings rows:", standings.length, standings);
  console.log("[EZ Parser] schedule rows:", schedule.length, schedule);

  return {
    standings,
    schedule,
    parsedAt: new Date().toISOString(),
  };
}