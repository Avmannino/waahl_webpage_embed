export default function StandingsTable({ title, rows = [] }) {
  return (
    <div className="tableCard">
      <div className="tableCardHead">
        <h3>{title}</h3>
      </div>

      <div className="tableWrap">
        <table className="statsTable">
          <thead>
            <tr>
              <th>RK</th>
              <th>Team</th>
              <th>GP</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>PTS</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>WP</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: "center", opacity: 0.8 }}>
                  No standings available yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${title}-${row.rank}-${row.team}`}>
                  <td>{row.rank}</td>
                  <td className="teamCell">{row.team}</td>
                  <td>{row.gp ?? "-"}</td>
                  <td>{row.w ?? "-"}</td>
                  <td>{row.l ?? "-"}</td>
                  <td>{row.t ?? "-"}</td>
                  <td className="ptsCell">{row.pts ?? "-"}</td>
                  <td>{row.gf ?? "-"}</td>
                  <td>{row.ga ?? "-"}</td>
                  <td>{row.gd ?? "-"}</td>
                  <td>{typeof row.wp === "number" ? row.wp.toFixed(3) : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}