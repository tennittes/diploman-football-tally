// scripts/extract_football_summary.js — Builds state/footballtally/daily_metrics_summary.json From Match Datasets
const fs = require("fs");
const path = require("path");

const LEAGUE_FILE_MAP = [
  { code: "BL1", name: "Bundesliga", file: "bl1-matches.json" },
  { code: "BSA", name: "Campeonato Brasileiro Serie A", file: "bsa-matches.json" },
  { code: "DED", name: "Eredivisie", file: "ded-matches.json" },
  { code: "FL1", name: "Ligue 1", file: "fl1-matches.json" },
  { code: "PD", name: "La Liga", file: "pd-matches.json" },
  { code: "PL", name: "Premier League", file: "pl-matches.json" },
  { code: "PPL", name: "Primeira Liga", file: "ppl-matches.json" },
  { code: "SA", name: "Serie A", file: "sa-matches.json" }
];

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function toNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function computeLeagueStandingsFromMatches(matches) {
  const clubStats = new Map();

  const ensureClub = (club) => {
    if (!clubStats.has(club)) {
      clubStats.set(club, {
        club,
        code: String(club).slice(0, 3).toUpperCase(),
        dft_pts: 0,
        std_pts: 0,
        weak_points: 0
      });
    }
    return clubStats.get(club);
  };

  for (const m of matches) {
    const home = m.home || "Home";
    const away = m.away || "Away";
    const hStat = ensureClub(home);
    const aStat = ensureClub(away);

    const hs = toNum(m.home_score, 0);
    const as = toNum(m.away_score, 0);
    const h1h = toNum(m.h1_home, 0);
    const h1a = toNum(m.h1_away, 0);
    const h2h = toNum(m.h2_home, 0);
    const h2a = toNum(m.h2_away, 0);

    // STD (3-1-0 full-time)
    if (hs > as) hStat.std_pts += 3;
    else if (as > hs) aStat.std_pts += 3;
    else {
      hStat.std_pts += 1;
      aStat.std_pts += 1;
    }

    // DFT (1 pt per half won + 1 bonus pt for winning both halves)
    let hWins = 0;
    let aWins = 0;
    if (h1h > h1a) {
      hStat.dft_pts += 1;
      hWins += 1;
    } else if (h1a > h1h) {
      aStat.dft_pts += 1;
      aWins += 1;
    }

    if (h2h > h2a) {
      hStat.dft_pts += 1;
      hWins += 1;
    } else if (h2a > h2h) {
      aStat.dft_pts += 1;
      aWins += 1;
    }

    if (hWins === 2) hStat.dft_pts += 1;
    if (aWins === 2) aStat.dft_pts += 1;
  }

  return Array.from(clubStats.values()).map((c) => ({
    ...c,
    weak_points: c.std_pts - c.dft_pts
  }));
}

function extractFootballSummary({ runDateUtc, dataDir, outputPath }) {
  const leagueSummaries = [];
  let latestMatchIso = runDateUtc;

  for (const lg of LEAGUE_FILE_MAP) {
    const matchFile = path.join(dataDir, lg.file);
    const matches = loadJson(matchFile, []);
    if (Array.isArray(matches) && matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      if (lastMatch && lastMatch.utcDate && lastMatch.utcDate.slice(0, 10) > latestMatchIso) {
        latestMatchIso = lastMatch.utcDate.slice(0, 10);
      }
    }

    const clubs = computeLeagueStandingsFromMatches(Array.isArray(matches) ? matches : []);
    const byDft = clubs.slice().sort((a, b) => b.dft_pts - a.dft_pts || b.std_pts - a.std_pts);
    const byStd = clubs.slice().sort((a, b) => b.std_pts - a.std_pts || b.dft_pts - a.dft_pts);
    const byWpDesc = clubs.slice().sort((a, b) => b.weak_points - a.weak_points || b.std_pts - a.std_pts);
    const byWpAsc = clubs.slice().sort((a, b) => a.weak_points - b.weak_points || b.dft_pts - a.dft_pts);

    const topDft = byDft[0] || { club: "Leader", dft_pts: 0, std_pts: 0, weak_points: 0 };
    const topStd = byStd[0] || { club: "Leader", dft_pts: 0, std_pts: 0, weak_points: 0 };
    const topWp = byWpDesc[0] || { club: "Leader", weak_points: 0 };
    const lowestWp = byWpAsc[0] || { club: "Leader", weak_points: 0 };

    leagueSummaries.push({
      code: lg.code,
      name: lg.name,
      dft_leader: topDft.club,
      dft_leader_pts: topDft.dft_pts,
      std_leader: topStd.club,
      std_leader_pts: topStd.std_pts,
      top_weak_points_club: topWp.club,
      top_weak_points: topWp.weak_points,
      lowest_weak_points_club: lowestWp.club,
      lowest_weak_points: lowestWp.weak_points,
      dft_top3: byDft.slice(0, 3),
      dft_bottom3: byDft.slice(-3).reverse(),
      std_top3: byStd.slice(0, 3),
      std_bottom3: byStd.slice(-3).reverse(),
      weak_points_top3: byWpDesc.slice(0, 3),
      weak_points_bottom3: byWpAsc.slice(0, 3)
    });
  }

  const active =
    leagueSummaries.find((l) => l.code === "PL") ||
    leagueSummaries[0] || {
      code: "PL",
      name: "Premier League",
      dft_leader: "Leader",
      dft_leader_pts: 0,
      std_leader: "Leader",
      std_leader_pts: 0,
      top_weak_points_club: "Leader",
      top_weak_points: 0,
      lowest_weak_points_club: "Leader",
      lowest_weak_points: 0,
      dft_top3: [],
      dft_bottom3: [],
      std_top3: [],
      std_bottom3: [],
      weak_points_top3: [],
      weak_points_bottom3: []
    };

  const summary = {
    schema_version: "1.0.0",
    run_date_utc: runDateUtc,
    latest_match_date_utc: latestMatchIso,
    vertical: "footballtally",
    tracked_league_count: leagueSummaries.length,
    active_league_code: active.code,
    active_league_name: active.name,
    top_primary_entity: active.dft_leader,
    top_primary_score: active.dft_leader_pts,
    top_weak_points_club: active.top_weak_points_club,
    maxWeakPoints: active.top_weak_points,
    lowest_weak_points_club: active.lowest_weak_points_club,
    minWeakPoints: active.lowest_weak_points,
    hasWeakPointsDivergence: Math.abs(active.top_weak_points) >= 4 || Math.abs(active.lowest_weak_points) >= 4,
    maxPositiveDelta: 3,
    maxNegativeDelta: 0,
    flatTopWatchCount: 0,
    hasPostSpikeReversion: false,
    creepStreakDays: 2,
    hasPrimarySecondarySplit: active.dft_leader !== active.std_leader,
    hasInverseDivergence: active.dft_leader !== active.std_leader,
    hasThroughputGap: false,
    hasStabilityLead: false,
    hasDualTopTier: active.dft_leader === active.std_leader,
    maxZoneClusterCount: 3,
    hasCorridorOrDerbyDriver: false,
    isTopMarginTight:
      active.dft_top3.length >= 3 && active.dft_top3[0].dft_pts - active.dft_top3[2].dft_pts <= 2,
    hasBottomTierDrag: active.dft_bottom3.length > 0 && active.dft_bottom3[0].dft_pts <= 3,
    hasTierCrossover: true,
    hasFiscalOrFundingTrigger: false,
    hasLeadershipOrTacticalShift: false,
    hasAccountabilityOrDisciplineEvent: false,
    hasExecutionOrSweepMilestone: true,
    hasFrictionOrLateShock: false,
    hasFiveDayCrossover: false,
    hasMidweekShift: false,
    leaderStreakRuns: 1,
    active_league_standings: {
      dft_top3: active.dft_top3,
      dft_bottom3: active.dft_bottom3,
      std_top3: active.std_top3,
      std_bottom3: active.std_bottom3,
      weak_points_top3: active.weak_points_top3,
      weak_points_bottom3: active.weak_points_bottom3
    },
    leagues: leagueSummaries.map((l) => ({
      code: l.code,
      name: l.name,
      dft_leader: l.dft_leader,
      dft_leader_pts: l.dft_leader_pts,
      std_leader: l.std_leader,
      std_leader_pts: l.std_leader_pts,
      top_weak_points_club: l.top_weak_points_club,
      top_weak_points: l.top_weak_points,
      lowest_weak_points_club: l.lowest_weak_points_club,
      lowest_weak_points: l.lowest_weak_points
    }))
  };

  saveJson(outputPath, summary);
  return summary;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (flag, def) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
  };

  try {
    const runDateUtc = getArg("--date", new Date().toISOString().slice(0, 10));
    const dataDir = getArg("--data-dir", "data");
    const outputPath = getArg("--out", path.join("state", "footballtally", "daily_metrics_summary.json"));

    const summary = extractFootballSummary({ runDateUtc, dataDir, outputPath });

    console.log(
      JSON.stringify(
        {
          status: "EXTRACTED",
          vertical: summary.vertical,
          run_date_utc: summary.run_date_utc,
          latest_match_date_utc: summary.latest_match_date_utc,
          active_league_code: summary.active_league_code,
          top_primary_entity: summary.top_primary_entity,
          top_primary_score: summary.top_primary_score,
          top_weak_points_club: summary.top_weak_points_club,
          maxWeakPoints: summary.maxWeakPoints
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error(JSON.stringify({ status: "ERROR", message: err.message }, null, 2));
    process.exit(1);
  }
}

module.exports = { extractFootballSummary, computeLeagueStandingsFromMatches };
