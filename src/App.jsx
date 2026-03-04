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

  const heroSlides = useMemo(
    () => [
      {
        src: hero1,
        kicker: "Wings Arena Adult Hockey League",
        title: "WAAHL",
        subtitle:
          "Where community meets competition — and every game ends with a smile.",
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
                subtitle="Where community meets competition — and every game ends with a smile."
              />

              <div className="heroInfoChips">
                <div className="heroChip">
                  <span className="heroChipLabel">Current Season</span>
                  <span className="heroChipValue">Standings & Schedule</span>
                </div>
                <div className="heroChip">
                  <span className="heroChipLabel">Spring Registration</span>
                  <span className="heroChipValue">A/B + C/D Leagues</span>
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
                  <p className="promoBadge">WAAHL • Spring 2026</p>
                  <h3>Where community meets competition</h3>
                  <p>
                    Join the next WAAHL season at Wings Arena. Register as an individual
                    free agent or submit a full team entry for Spring 2026.
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
                  <h3>Spring Season Registration</h3>
                  <p>
                    Choose the correct division registration card below to register for the
                    upcoming WAAHL Spring 2026 season.
                  </p>
                </div>

                <div className="registrationNotes">
                  <div className="registrationNoteCard">
                    <p className="registrationNoteTitle">A/B League</p>
                    <p className="registrationNoteText">
                      Competitive division for higher-level adult players and teams.
                    </p>
                  </div>

                  <div className="registrationNoteCard">
                    <p className="registrationNoteTitle">C/D League</p>
                    <p className="registrationNoteText">
                      Great fit for recreational / developing players seeking more casual, yet still competitive matchups.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR section moved BELOW the two spring cards */}
            <div className="springTopRegistrationCard">
              <div className="springTopRegistrationHead">
                <h3>Register by Division</h3>
                <p>Scan the correct QR code below for your league registration.</p>
              </div>

              <div className="springRegistrationCardsRow">
                <div className="qrCard">
                  <p className="qrTitle">A/B League Registration</p>
                  <img src={qrAB} alt="A/B League registration QR code" className="qrImg" />
                  <p className="qrCaption">Scan to register for A/B League</p>
                </div>

                <div className="qrCard">
                  <p className="qrTitle">C/D League Registration</p>
                  <img src={qrCD} alt="C/D League registration QR code" className="qrImg" />
                  <p className="qrCaption">Scan to register for C/D League</p>
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

            {/* <div className="flyerPreviewCard">
              <div className="flyerPreviewText">
                <h3>Spring Flyer Preview</h3>
                <p>
                  Promotional artwork for the Spring 2026 WAAHL season. This page focuses on
                  current season standings/schedule (from EZLeagues) and registration QR access
                  for the upcoming season.
                </p>
              </div>
              <div className="flyerPreviewImageWrap">
                <img
                  src={springFlyer}
                  alt="WAAHL Spring 2026 promotional flyer"
                  className="flyerPreviewImage"
                />
              </div>
            </div> */}
          </div>
        </section>
      </main>
    </div>
  );
}