import { useEffect, useRef } from "react";

export default function ScheduleTable({ rows = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // On load/update, scroll to bottom so the newest / next upcoming games are visible.
    // This makes the next scheduled games appear at the bottom of the visible list.
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [rows]);

  return (
    <div className="tableCard">
      <div className="tableCardHead">
        <h3>Upcoming / League Schedule</h3>
      </div>

      {/* Scrollable viewport so only ~6 rows are visible before scroll */}
      <div ref={scrollRef} className="tableWrap tableWrapScheduleLimited">
        <table className="statsTable scheduleTable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Matchup</th>
              <th>Rink</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", opacity: 0.8 }}>
                  No schedule available yet.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={`${row.date}-${row.time}-${row.home}-${row.away}-${idx}`}>
                  <td>{row.date}</td>
                  <td>{row.time}</td>
                  <td className="matchupCell">
                    {row.home} <span className="vs">vs</span> {row.away}
                  </td>
                  <td>{row.rink || "Wings Arena"}</td>
                  <td>{row.gameType || "-"}</td>
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