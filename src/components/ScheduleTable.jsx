import { useEffect, useRef } from "react";

function parseScheduleDateString(dateStr = "") {
  // Supports strings like: "Wed-Mar 4"
  const match = String(dateStr).match(
    /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)-([A-Za-z]{3})\s+(\d{1,2})$/
  );
  if (!match) return null;

  const monthMap = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const monthIndex = monthMap[match[2]];
  const day = Number(match[3]);

  if (monthIndex == null || Number.isNaN(day)) return null;

  // Fixed year used only for formatting output (year is not displayed)
  return new Date(2026, monthIndex, day);
}

function getOrdinal(day) {
  if (day >= 11 && day <= 13) return "th";
  const last = day % 10;
  if (last === 1) return "st";
  if (last === 2) return "nd";
  if (last === 3) return "rd";
  return "th";
}

function formatScheduleDateDesktop(dateStr = "") {
  const d = parseScheduleDateString(dateStr);
  if (!d) return dateStr;

  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const month = d.toLocaleDateString(undefined, { month: "long" });
  const day = d.getDate();

  return `${weekday}, ${month} ${day}${getOrdinal(day)}`;
}

function formatScheduleDateMobile(dateStr = "") {
  const d = parseScheduleDateString(dateStr);
  if (!d) return dateStr;

  const month = d.getMonth() + 1;
  const day = String(d.getDate()).padStart(2, "0");

  return `${month}/${day}`;
}

export default function ScheduleTable({ title = "Upcoming / League Schedule", rows = [] }) {
  const scrollRef = useRef(null);

  // Scroll so the next unplayed game sits at the top, just under the sticky
  // header. Falls back to the bottom once every game has been played.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const nextIdx = rows.findIndex(
      (row) => !/^(complete|result pending)/i.test(row.status || "")
    );

    requestAnimationFrame(() => {
      const nextRow = nextIdx === -1 ? null : el.querySelectorAll("tbody tr")[nextIdx];
      if (!nextRow) {
        el.scrollTop = el.scrollHeight;
        return;
      }

      const headerHeight = el.querySelector("thead")?.offsetHeight || 0;
      el.scrollTop +=
        nextRow.getBoundingClientRect().top - el.getBoundingClientRect().top - headerHeight;
    });
  }, [rows]);

  // Keep this only for column visibility if you want.
  // If this causes similar issues when resizing, we can also handle rink column with CSS.
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;

  return (
    <div className="tableCard">
      <div className="tableCardHead">
        <h3>{title}</h3>
      </div>

      <div ref={scrollRef} className="tableWrap tableWrapScheduleLimited">
        <table className="statsTable scheduleTable">
          <thead>
            <tr>
              {isMobile ? <th className="scheduleDayCol">Day</th> : null}
              <th>Date</th>
              <th className="scheduleTimeCol">Time</th>
              <th className="scheduleMatchupCol">Matchup</th>
              {!isMobile ? <th>Rink</th> : null}
              <th className="scheduleTypeCol">Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", opacity: 0.8 }}>
                  No schedule available yet.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={`${row.date}-${row.time}-${row.home}-${row.away}-${idx}`}>
                  {isMobile ? (
                    <td className="scheduleDayCol">{String(row.date).split("-")[0]}</td>
                  ) : null}
                  <td>
                    <span className="scheduleDateDesktop">
                      {formatScheduleDateDesktop(row.date)}
                    </span>
                    <span className="scheduleDateMobile">
                      {formatScheduleDateMobile(row.date)}
                    </span>
                  </td>
                  <td className="scheduleTimeCol">{row.time}</td>
                  <td className="matchupCell scheduleMatchupCol">
                    {row.home} <span className="vs">vs</span> {row.away}
                  </td>
                  {!isMobile ? <td>{row.rink || "Wings Arena"}</td> : null}
                  <td className="scheduleTypeCol">{row.gameType || "-"}</td>
                  <td>{row.status || "Scheduled"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}