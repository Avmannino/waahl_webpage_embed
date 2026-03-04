import { useEffect, useMemo, useState } from "react";
import "./App.css";

import HeroCarousel from "./components/HeroCarousel";
import SectionHeader from "./components/SectionHeader";
import StandingsTable from "./components/StandingsTable";
import ScheduleTable from "./components/ScheduleTable";

import hero1 from "./assets/hero/hero-1.jpg";
import hero2 from "./assets/hero/hero-2.jpg";
import hero3 from "./assets/hero/hero-3.jpg";
import hero4 from "./assets/hero/hero-4.jpg";

import qrAB from "./assets/qr/qr-ab-league.jpg";
import qrCD from "./assets/qr/qr-cd-league.jpg";
// import springFlyer from "./assets/spring/spring-flyer.jpg";

import {
  seasonMeta,
  fallbackStandings,
  fallbackSchedule,
} from "./data/waahlData";

import { fetchWaahlLeagueData } from "./utils/fetchWaahlLeagueData";

const AB_REGISTRATION_URL =
  "https://tms.ezfacility.com/OnlineRegistrations/Register.aspx?CompanyID=8390&GroupID=4013044";

const CD_REGISTRATION_URL =
  "https://tms.ezfacility.com/OnlineRegistrations/Register.aspx?CompanyID=8390&GroupID=4013045";

function formatMoneyNoCents(n) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function App() {
  const [leagueData, setLeagueData] = useState({
    standings: fallbackStandings,
    schedule: fallbackSchedule,
    parsedAt: null,
  });
  const [loadingLeagueData, setLoadingLeagueData] = useState(true);
  const [leagueError, setLeagueError] = useState("");
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLeagueData() {
      try {
        setLoadingLeagueData(true);
        setLeagueError("");

        const parsed = await fetchWaahlLeagueData();
        if (cancelled) return;

        setLeagueData({
          standings: parsed.standings || [],
          schedule: parsed.schedule || [],
          parsedAt: parsed.parsedAt || null,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch/parse EZLeagues data:", err);
        setLeagueError(
          "Live standings/schedule could not be loaded right now. The proxy response was invalid or unavailable."
        );
      } finally {
        if (!cancelled) setLoadingLeagueData(false);
      }
    }

    loadLeagueData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isGuidelinesOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsGuidelinesOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isGuidelinesOpen]);

  const heroSlides = useMemo(
    () => [
      {
        src: hero1,
        kicker: "Wings Arena Adult Hockey League",
        title: "WAAHL",
        subtitle:
          "Where community meets competition — and every game ends with a handshake.",
      },
      {
        src: hero2,
        kicker: "Current Season",
        title: "Standings & Schedule",
        subtitle:
          "Automatically pulled from EZLeagues when available (with fallback support).",
      },
      {
        src: hero3,
        kicker: "Spring 2026 Registration",
        title: "A/B + C/D Leagues",
        subtitle:
          "Register now for the May–July season. Individual free agents and full team entries welcome.",
      },
      {
        src: hero4,
        kicker: "Wings Arena • Stamford, CT",
        title: "Play Hard. Meet Great People.",
        subtitle:
          "Competitive adult hockey with a strong community feel at Wings Arena.",
      },
    ],
    []
  );

  return (
    <div className="waahlPage">
      {/* HERO WRAP WITH PNG BACKGROUND + OVERLAY */}
      <header className="heroShell" role="banner">
        <div className="heroShellBackdrop" aria-hidden="true" />
        <div className="heroShellOverlay" aria-hidden="true" />

        <div className="container heroShellInner">
          <div className="heroSplit">
            {/* LEFT SIDE: headers */}
            <div className="heroContentLeft">
              <SectionHeader
                eyebrow="Wings Arena Adult Hockey League"
                title="WAAHL"
                subtitle="Where community meets competition — and every game ends with a handshake."
              />

              <div className="heroInfoChips">
                <button
                  type="button"
                  className="heroChip heroChipButton"
                  onClick={() => setIsGuidelinesOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isGuidelinesOpen}
                >
                  <span className="heroChipLabel">League Info</span>
                  <span className="heroChipValue">WAAHL Guidelines &amp; Format</span>
                  <span className="heroChipHint">Click to view rules</span>
                </button>

                <div className="heroChip">
                  <span className="heroChipLabel">Spring Registration is LIVE!</span>
                  <span className="heroChipValue">Scroll Down For More</span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: standalone carousel */}
            <div className="heroCarouselCol">
              <HeroCarousel slides={heroSlides} autoMs={5000} showContent={false} />
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* CURRENT SEASON */}
        <section className="section sectionCurrent" id="current-season">
          <div className="container">
            <div className="sectionHeaderCenter">
              <SectionHeader
                eyebrow={seasonMeta.currentSeasonLabel}
                title={`Standings & Schedule • ${seasonMeta.currentSeasonSubLabel}`}
              />
            </div>

            {leagueError ? (
              <div className="tableCard" style={{ marginBottom: 16 }}>
                <div className="tableCardHead">
                  <h3>Schedule / Standings Unavailable</h3>
                </div>
                <div style={{ padding: 14 }}>
                  <p style={{ margin: 0, color: "#ffd6de", lineHeight: 1.45 }}>
                    {leagueError}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="standingsGrid" style={{ gridTemplateColumns: "1fr" }}>
              <StandingsTable
                title={
                  loadingLeagueData
                    ? "Current League Standings (Loading...)"
                    : "Current League Standings (EZLeagues)"
                }
                rows={leagueData.standings}
              />
            </div>

            <div className="scheduleWrap">
              <ScheduleTable rows={leagueData.schedule} />
            </div>
          </div>
        </section>

        {/* SPRING PROMO */}
        <section className="section sectionSpring" id="spring-season">
          <div className="container">
            <div className="sectionHeaderCenter">
              <SectionHeader
                eyebrow={seasonMeta.springSeasonLabel}
                title={`${seasonMeta.registrationHeadline}`}
                subtitle="May–July 2026 season registration is now open for A/B and C/D divisions."
              />
            </div>

            <div className="promoGrid">
              <div className="promoCard">
                <div className="promoTop">
                  <p className="promoBadge">WAAHL • Spring 2026 Registration</p>
                  <h3>Where community meets competition</h3>
                  <p>
                    Join the next WAAHL season at Wings Arena. Register as an individual
                    free agent or submit a full team entry.
                  </p>
                </div>

                <div className="pricingRow">
                  <div className="priceCard">
                    <p className="priceLabel">Individual Free Agent Players</p>
                    <p className="priceValue">
                      {formatMoneyNoCents(seasonMeta.freeAgentPrice)}
                    </p>
                    <p className="priceNote">Jersey included</p>
                  </div>

                  <div className="priceCard">
                    <p className="priceLabel">Full Team Entries</p>
                    <p className="priceValue">
                      {formatMoneyNoCents(seasonMeta.fullTeamPrice)}
                    </p>
                    <p className="priceNote">Teams provide their own jerseys</p>
                  </div>
                </div>
              </div>

              {/* Right column supporting info */}
              <div className="qrPanel">
                <div className="qrPanelHeader">
                  <h3>Skill Levels</h3>
                  <p>
                    We welcome players of all abilities & skill-levels
                  </p>
                </div>

                <div className="registrationNotes">
                  <div className="registrationNoteCard">
                    <p className="registrationNoteTitle">A/B League</p>
                    <p className="registrationNoteText">
                      Competitive division for higher-level, experienced players and teams.
                    </p>
                  </div>

                  <div className="registrationNoteCard">
                    <p className="registrationNoteTitle">C/D League</p>
                    <p className="registrationNoteText">
                      Great fit for recreational / developing players seeking more casual, yet still competitive play.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR section moved BELOW the two spring cards */}
            <div className="springTopRegistrationCard">
              <div className="springTopRegistrationHead">
                <h3>Spring 2026 Registration</h3>
                <p>Scan or click below to register.</p>
              </div>

              <div className="springRegistrationCardsRow">
                <div className="qrCard">
                  <p className="qrTitle">A/B League</p>
                  <img src={qrAB} alt="A/B League registration QR code" className="qrImg" />
                  <p className="qrCaption">Scan or click below to register for A/B League</p>
                  <a
                    href={AB_REGISTRATION_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="qrRegisterLink"
                  >
                    REGISTER HERE
                  </a>
                </div>

                <div className="qrCard">
                  <p className="qrTitle">C/D League</p>
                  <img src={qrCD} alt="C/D League registration QR code" className="qrImg" />
                  <p className="qrCaption">Scan or click below to register for C/D League</p>
                  <a
                    href={CD_REGISTRATION_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="qrRegisterLink"
                  >
                    REGISTER HERE
                  </a>
                </div>
              </div>
            </div>

            <div className="springNeedHelpCardWrap">
              <div className="registrationNoteCard springNeedHelpCard">
                <p className="registrationNoteTitle">Need Help?</p>
                <p className="registrationNoteText">
                  Contact{" "}
                  <a href={`mailto:${seasonMeta.contactEmail}`}>{seasonMeta.contactEmail}</a>{" "}
                  for registration questions, roster info, or team entry details.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Guidelines Modal */}
      {isGuidelinesOpen && (
        <div
          className="guidelinesModalOverlay"
          onClick={() => setIsGuidelinesOpen(false)}
          role="presentation"
        >
          <div
            className="guidelinesModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="waahl-guidelines-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="guidelinesModalHeader">
              <div>
                <p className="guidelinesModalEyebrow">WAAHL</p>
                <h2 id="waahl-guidelines-title">Guidelines &amp; Format</h2>
              </div>

              <button
                type="button"
                className="guidelinesCloseBtn"
                onClick={() => setIsGuidelinesOpen(false)}
                aria-label="Close guidelines modal"
              >
                ✕
              </button>
            </div>

            <div className="guidelinesModalBody">
              <div className="guidelineSection">
                <h3>Game Format</h3>
                <ul>
                  <li>3 x 15-minute running-time periods</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Mercy Rule</h3>
                <ul>
                  <li>6+ goal lead → running time until reduced to 4 goals or fewer.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Penalties</h3>
                <ul>
                  <li>All penalties served as stop time.</li>
                  <li>4 penalties in one game = ejection (not a misconduct).</li>
                  <li>High stick causing bleeding = automatic double minor.</li>
                  <li>Intentional high stick = automatic match penalty.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Rosters &amp; Eligibility</h3>
                <ul>
                  <li>Team Goalies play free</li>
                  <li>Roster lock: halfway through season</li>
                  <li>No new players after roster lock.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Player Participation</h3>
                <ul>
                  <li>Players can join multiple teams.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Equipment</h3>
                <ul>
                  <li>Helmets required.</li>
                  <li>Full face shields strongly recommended. Visor allowed at player discretion</li>
                  <li>Goalie gear must meet adult standards.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Tie Games</h3>
                <ul>
                  <li>Regular season: 3 on 3 5 minute overtime</li>
                  <li>Playoffs: 5-min 5v5 OT → 3-shooter shootout.</li>
                  <li>Championships: 5-min 5v5, then 4v4, then 3v3, then 2v2, 1v1</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Roster Challenges</h3>
                <ul>
                  <li>Opponents may challenge rosters anytime.</li>
                  <li>Players must show valid photo ID.</li>
                  <li>Violations: 5-min major + ejection, captain suspended 1 game.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Code of Conduct</h3>
                <ul>
                  <li>Zero tolerance for harassment, discrimination, or abuse.</li>
                  <li>Violations = suspension or league removal.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Discipline &amp; Misconduct</h3>
                <p className="guidelineSubhead">Game Misconducts</p>
                <ul>
                  <li>1st: 2-game suspension</li>
                  <li>2nd: 4-game suspension</li>
                  <li>3rd: Season &amp; playoff suspension</li>
                </ul>

                <p className="guidelineSubhead">Match Penalties</p>
                <ul>
                  <li>1st: 3-game suspension + $100 fine</li>
                  <li>2nd: Season removal + $200 team fine</li>
                  <li>Attempt to injure: permanent removal</li>
                  <li>2 total removals = permanent league ban.</li>
                  <li>Multiple infractions may lead to permanent removal.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Penalty Minute Limits</h3>
                <ul>
                  <li>30 PIM = 2-game suspension</li>
                  <li>40 PIM = additional 2 games</li>
                  <li>45+ PIM = suspended for season/playoffs</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Ringer Rule</h3>
                <ul>
                  <li>5-goal cap per player; additional goals = 2-min minor per infraction.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Referee Authority</h3>
                <ul>
                  <li>Certified CIHRA officials.</li>
                  <li>Referee decisions are final.</li>
                  <li>Ref abuse = immediate discipline.</li>
                </ul>
              </div>

              <div className="guidelineSection">
                <h3>Minimum Roster to Play</h3>
                <ul>
                  <li>Game can start with 3 players.</li>
                  <li>
                    Teams may play without a goalie, but 6th skater cannot cover puck or act as goalie.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}