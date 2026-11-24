// scripts/queue_scored_brief.js — Generates Dynamic, Boilerplate-Free Scored Briefs Into news-queue.json
const fs = require("fs");
const path = require("path");

const DIPLOMAN_TIMES_URL = "https://www.diplomantimes.com";
const FOOTBALL_REPO_RAW_BASE = "https://raw.githubusercontent.com/tennittes/diploman-football-tally/main";
const FOOTBALL_FALLBACK_BANNER =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiEjynaVCtt3sYwWSMmZt6p3IJG5W9t1DwrfmFCawdojeihYVuNN75wZymwVLZ_fx6Ampvi6r7j1xQ1IhAkOcdfl4BrGf6Bs6xi_hkvmR6nHQXbr7KQyHbooyUOXqNW_TrZZiAkz5iSFglPx0irzR23AoBeG0Ren9o1ZV9GlRTNSYJqRcvaBHom2hXhvTM/s1080/Diploman%20Football%20Stats%20Logo.png";

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function escapeXml(str) {
  const amp = String.fromCharCode(38);
  return String(str ?? "")
    .replace(/\x26/g, `${amp}amp;`)
    .replace(/\x3c/g, `${amp}lt;`)
    .replace(/\x3e/g, `${amp}gt;`)
    .replace(/\x22/g, `${amp}quot;`)
    .replace(/\x27/g, `${amp}apos;`);
}

function formatDelta(val) {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return "0";
  if (n > 0) return `+${n}`;
  return `${n}`;
}

function formatList(items, formatter, conjunction = "and") {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) return "";
  const formatted = list.map(formatter);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} ${conjunction} ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(", ")}, ${conjunction} ${formatted[formatted.length - 1]}`;
}

/**
 * Generates a 100% original, copyright-free 1200x675 SVG Telemetry Card
 * plotting DFT (Two-Half) vs STD (Full-Time) points for featured clubs.
 */
function generateFootballTelemetryCardSvg({ dateStr, leagueName, leagueCode, focusTag, headline, rows }) {
  const safeRows = (Array.isArray(rows) ? rows : []).slice(0, 5);
  const maxPts = Math.max(
    20,
    ...safeRows.map((r) => Math.max(Number(r.dft_pts || 0), Number(r.std_pts || 0)))
  );

  const barMaxWidth = 540;
  const startY = 235;
  const rowGap = 76;

  const barsSvg = safeRows
    .map((r, i) => {
      const y = startY + i * rowGap;
      const dft = Number(r.dft_pts || 0);
      const std = Number(r.std_pts || 0);
      const wp = formatDelta(r.weak_points ?? std - dft);
      const dftW = Math.max(12, Math.round((dft / maxPts) * barMaxWidth));
      const stdW = Math.max(12, Math.round((std / maxPts) * barMaxWidth));
      const rank = String(i + 1).padStart(2, "0");

      return `
      <g transform="translate(64, ${y})">
        <rect x="0" y="0" width="1072" height="62" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
        <text x="20" y="37" fill="#60A5FA" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="900">${rank}</text>
        <text x="58" y="37" fill="#F8FAFC" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="19" font-weight="800">${escapeXml(r.club)}</text>

        <!-- DFT Bar -->
        <rect x="330" y="13" width="${dftW}" height="15" rx="3" fill="#2563EB"/>
        <text x="${330 + dftW + 10}" y="25" fill="#93C5FD" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="800">${dft} DFT</text>

        <!-- STD Bar -->
        <rect x="330" y="34" width="${stdW}" height="15" rx="3" fill="#10B981"/>
        <text x="${330 + stdW + 10}" y="46" fill="#6EE7B7" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="800">${std} STD</text>

        <!-- Weak Points Pill -->
        <rect x="955" y="15" width="96" height="32" rx="4" fill="#0F172A" stroke="#3B82F6" stroke-width="1"/>
        <text x="1003" y="36" text-anchor="middle" fill="#F8FAFC" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="900">${escapeXml(wp)} WP</text>
      </g>`;
    })
    .join("\n");

  const shortHeadline =
    headline.length > 74 ? `${headline.slice(0, 71).replace(/\s+\S*$/, "")}...` : headline;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${escapeXml(headline)}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#172554"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="675" fill="url(#bgGrad)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#2563EB"/>

  <!-- Top Header Strip -->
  <rect x="64" y="42" width="275" height="34" rx="4" fill="#2563EB"/>
  <text x="201" y="64" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="900" letter-spacing="1.2">DIPLOMAN FOOTBALL STATS</text>

  <rect x="352" y="42" width="230" height="34" rx="4" fill="#1E293B" stroke="#3B82F6" stroke-width="1"/>
  <text x="467" y="64" text-anchor="middle" fill="#93C5FD" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="800" letter-spacing="0.8">${escapeXml(leagueName.toUpperCase())} (${escapeXml(leagueCode)})</text>

  <text x="1136" y="65" text-anchor="end" fill="#94A3B8" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="15" font-weight="800" letter-spacing="0.6">${escapeXml(dateStr)} UTC</text>

  <!-- Title & Focus -->
  <text x="64" y="122" fill="#60A5FA" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="900" letter-spacing="1.4">${escapeXml(focusTag.toUpperCase())}</text>
  <text x="64" y="162" fill="#FFFFFF" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="27" font-weight="900">${escapeXml(shortHeadline)}</text>

  <!-- Legend -->
  <rect x="64" y="190" width="14" height="14" rx="2" fill="#2563EB"/>
  <text x="86" y="202" fill="#CBD5E1" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="700">DFT (Two-Half Points)</text>

  <rect x="275" y="190" width="14" height="14" rx="2" fill="#10B981"/>
  <text x="297" y="202" fill="#CBD5E1" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="700">STD (Full-Time Points)</text>

  <text x="1136" y="202" text-anchor="end" fill="#94A3B8" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="700">WP = STD MINUS DFT DIFFERENTIAL</text>

  <!-- Data Rows -->
  ${barsSvg}

  <!-- Footer -->
  <text x="64" y="644" fill="#64748B" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="700">PROPRIETARY TWO-HALF TELEMETRY • WWW.DIPLOMANTIMES.COM</text>
</svg>`;
}

function buildFootballDraft(selection, metrics, dateStr, repoRoot) {
  const angleId = String(selection.selected_angle_id || "04").padStart(2, "0");
  const family = String(selection.family || "").toLowerCase();
  const topEntity = metrics.top_primary_entity || "Brighton Hove";
  const topScore = metrics.top_primary_score ?? 0;

  const leagueName = metrics.active_league_name || "Premier League";
  const leagueCode = metrics.active_league_code || "PL";
  const standings = metrics.active_league_standings || {};
  const dftTop3 = Array.isArray(standings.dft_top3) ? standings.dft_top3 : [];
  const dftBottom3 = Array.isArray(standings.dft_bottom3) ? standings.dft_bottom3 : [];
  const stdTop3 = Array.isArray(standings.std_top3) ? standings.std_top3 : [];
  const stdBottom3 = Array.isArray(standings.std_bottom3) ? standings.std_bottom3 : [];
  const wpTop3 = Array.isArray(standings.weak_points_top3) ? standings.weak_points_top3 : [];
  const wpBottom3 = Array.isArray(standings.weak_points_bottom3) ? standings.weak_points_bottom3 : [];

  const runnerUp = dftTop3[1] || { club: "nearest rival", dft_pts: topScore, std_pts: topScore, weak_points: 0 };
  const thirdClub = dftTop3[2] || null;
  const tailClub = dftBottom3[0] || { club: "the bottom club", dft_pts: 0, std_pts: 0, weak_points: 0 };
  const stdLeader = stdTop3[0] || { club: topEntity, std_pts: topScore, dft_pts: topScore, weak_points: 0 };
  const stdRunnerUp = stdTop3[1] || null;
  const topDftObj = dftTop3[0] || { club: topEntity, dft_pts: topScore, std_pts: topScore, weak_points: 0 };

  const topWpClub =
    wpTop3[0] ||
    (metrics.top_weak_points_club
      ? { club: metrics.top_weak_points_club, weak_points: Number(metrics.maxWeakPoints ?? 0), std_pts: 0, dft_pts: 0 }
      : null);
  const lowestWpClub =
    wpBottom3[0] ||
    (metrics.lowest_weak_points_club
      ? { club: metrics.lowest_weak_points_club, weak_points: Number(metrics.minWeakPoints ?? 0), std_pts: 0, dft_pts: 0 }
      : null);

  const otherLeagues = (Array.isArray(metrics.leagues) ? metrics.leagues : []).filter(
    (l) => l.code !== leagueCode
  );

  // Route into distinct editorial lenses so consecutive days during a matchweek spotlight different facets
  let lens = "dft_lead";
  if (angleId === "07" || angleId === "08" || family.includes("bottom") || family.includes("relegation") || family.includes("tail")) {
    lens = "relegation_pressure";
  } else if (angleId === "04" || angleId === "09" || angleId === "10" || family.includes("weak") || family.includes("divergence") || family.includes("split")) {
    lens = "weak_points_split";
  } else if (angleId === "11" || angleId === "12" || family.includes("std") || family.includes("full_time") || family.includes("contrast")) {
    lens = "std_vs_dft_contrast";
  } else if (angleId === "13" || angleId === "14" || family.includes("cross") || family.includes("league") || family.includes("europe")) {
    lens = "cross_league_index";
  } else if (angleId === "06" || angleId === "05" || family.includes("margin") || family.includes("chase") || family.includes("podium")) {
    lens = "podium_margin";
  }

  let title;
  let summary;
  let leadNarrative;
  let focusTag;
  let chartRows = dftTop3.concat(dftBottom3.slice(0, 2));

  switch (lens) {
    case "relegation_pressure": {
      focusTag = "Bottom-Three Survival & Relegation Watch";
      title = `Lower-Tier Pressure Persists on ${tailClub.club} (${tailClub.dft_pts} Pts) as ${topEntity} Stays Ahead on ${topScore} DFT Pts`;
      summary =
        `${tailClub.club} remains bottom of the ${leagueName} two-half standings on ${tailClub.dft_pts} points while ${topEntity} leads on ${topScore} points.`;
      leadNarrative =
        `Bottom-ranked ${tailClub.club} sits at the foot of the ${leagueName} (${leagueCode}) two-half table with ${tailClub.dft_pts} points as of ${dateStr}, ` +
        `contrasting sharply with frontrunner ${topEntity} on ${topScore} points. ` +
        `Across the wider ${leagueName} table split, ${stdLeader.club} paces the standard full-time standings with ${stdLeader.std_pts} points` +
        (topWpClub ? `, while ${topWpClub.club} carries the steepest Weak Points gap at ${formatDelta(topWpClub.weak_points)} WP.` : ".");
      chartRows = dftBottom3.concat(dftTop3.slice(0, 2));
      break;
    }
    case "weak_points_split": {
      focusTag = "Half-Split Efficiency & Weak Points Index";
      const wpFocus = topWpClub || stdLeader;
      const wpVal = formatDelta(wpFocus.weak_points ?? 0);
      title = `${wpFocus.club} Posts ${wpVal} Weak Points Split as ${leagueName} Two-Half Table Diverges`;
      summary =
        `${wpFocus.club} records a ${wpVal} Weak Points gap between full-time (${wpFocus.std_pts} pts) and two-half (${wpFocus.dft_pts} pts) ${leagueName} standings.`;
      leadNarrative =
        `Structural divergence between single-half survival and full-match control defines the ${leagueName} (${leagueCode}) Weak Points index on ${dateStr}, ` +
        `led by ${wpFocus.club} at ${wpVal} WP (${wpFocus.std_pts} STD vs ${wpFocus.dft_pts} DFT). ` +
        `Meanwhile, ${topEntity} tops the pure two-half tally on ${topScore} points while ${stdLeader.club} leads the standard table on ${stdLeader.std_pts} points.`;
      chartRows = wpTop3.length ? wpTop3.concat(dftTop3.slice(0, 2)) : dftTop3;
      break;
    }
    case "std_vs_dft_contrast": {
      focusTag = "Full-Time Standings vs. Two-Half Control";
      title = `${stdLeader.club} (${stdLeader.std_pts} STD Pts) Sets Full-Time Pace Against ${topEntity}'s ${topScore}-Pt DFT Lead`;
      summary =
        `${stdLeader.club} commands the standard ${leagueName} table on ${stdLeader.std_pts} points even as ${topEntity} leads two-half scoring on ${topScore} points.`;
      leadNarrative =
        `Comparing standard full-time points against Diploman two-half tallies in the ${leagueName} (${leagueCode}) on ${dateStr} highlights two distinct routes to the summit: ` +
        `${stdLeader.club} leads the conventional table with ${stdLeader.std_pts} points (${formatDelta(stdLeader.weak_points ?? 0)} WP), ` +
        `whereas ${topEntity} holds first place in two-half control with ${topScore} DFT points.`;
      chartRows = stdTop3.length ? stdTop3.concat(dftTop3.slice(0, 2)) : dftTop3;
      break;
    }
    case "cross_league_index": {
      focusTag = "European Cross-League DFT Benchmark";
      const secondLeague = otherLeagues[0];
      title = secondLeague
        ? `${leagueName} (${topEntity}, ${topScore} Pts) and ${secondLeague.name} (${secondLeague.dft_leader}, ${secondLeague.dft_leader_pts} Pts) Set DFT Pace`
        : `Cross-League DFT Benchmark: ${topEntity} Leads ${leagueName} on ${topScore} Two-Half Points`;
      summary =
        `${topEntity} sets the ${leagueName} two-half benchmark on ${topScore} points alongside fellow top-flight pacesetters across Europe on ${dateStr}.`;
      leadNarrative =
        `Across Europe's tracked top-flight divisions on ${dateStr}, ${topEntity} anchors the ${leagueName} (${leagueCode}) two-half standings on ${topScore} points` +
        (secondLeague
          ? `, while ${secondLeague.dft_leader} tops ${secondLeague.name} on ${secondLeague.dft_leader_pts} DFT points (${secondLeague.std_leader} leads ${secondLeague.name} full-time on ${secondLeague.std_leader_pts} pts).`
          : ` ahead of ${runnerUp.club} (${runnerUp.dft_pts} points).`);
      break;
    }
    case "podium_margin": {
      focusTag = "Summit Margin & Podium Chasing Pack";
      const gap = Math.max(0, Number(topScore) - Number(runnerUp.dft_pts ?? topScore));
      title = `${topEntity} (${topScore} Pts) Holds ${gap}-Point Cushion Over ${runnerUp.club} (${runnerUp.dft_pts} Pts) in ${leagueName}`;
      summary =
        `${topEntity} maintains a ${gap}-point buffer ahead of ${runnerUp.club} (${runnerUp.dft_pts} points) at the top of the ${leagueName} DFT table.`;
      leadNarrative =
        `A ${gap}-point margin separates first-placed ${topEntity} (${topScore} points) from second-placed ${runnerUp.club} (${runnerUp.dft_pts} points) in the ${leagueName} (${leagueCode}) two-half standings on ${dateStr}. ` +
        `In the standard full-time standings, ${stdLeader.club} sets the pace with ${stdLeader.std_pts} points (${formatDelta(stdLeader.weak_points ?? 0)} WP).`;
      break;
    }
    default: {
      focusTag = "Two-Half Standings & Table Leaders";
      title = `${topEntity} Holds ${leagueName} DFT Lead on ${topScore} Pts Ahead of ${runnerUp.club} (${runnerUp.dft_pts} Pts)`;
      summary =
        `${topEntity} leads the ${leagueName} two-half table on ${topScore} points ahead of ${runnerUp.club}, while ${stdLeader.club} tops full-time standings.`;
      leadNarrative =
        `${topEntity} paces the ${leagueName} (${leagueCode}) two-half standings with ${topScore} points (${formatDelta(topDftObj.weak_points ?? 0)} WP) ahead of ${runnerUp.club} (${runnerUp.dft_pts} points) on ${dateStr}. ` +
        `Meanwhile, ${stdLeader.club} holds first place in the standard full-time table on ${stdLeader.std_pts} points (${formatDelta(stdLeader.weak_points ?? 0)} WP), highlighting contrasting paths to points accumulation.`;
      break;
    }
  }

  const dftPodiumText = dftTop3.length
    ? formatList(
        dftTop3,
        (c, idx) => `${idx + 1}. ${c.club} (${c.dft_pts} pts, ${formatDelta(c.weak_points ?? 0)} WP)`
      )
    : `${topEntity} (${topScore} pts)`;

  const gapToSecond = Math.max(0, Number(topScore) - Number(runnerUp.dft_pts ?? topScore));
  const gapToThird = thirdClub
    ? Math.max(0, Number(topScore) - Number(thirdClub.dft_pts ?? topScore))
    : 0;

  const p1 =
    `At the top of the ${leagueName} two-half standings, the leading trio sits at ${dftPodiumText}. ` +
    `${topEntity} holds a ${gapToSecond}-point cushion over ${runnerUp.club}` +
    (thirdClub ? ` and leads third-placed ${thirdClub.club} by ${gapToThird} points.` : ".");

  const stdTopText = stdTop3.length
    ? formatList(stdTop3, (c) => `${c.club} (${c.std_pts} pts, ${formatDelta(c.weak_points ?? 0)} WP)`)
    : `${stdLeader.club} (${stdLeader.std_pts} pts)`;

  const wpTopText = wpTop3.length
    ? formatList(
        wpTop3,
        (c) => `${c.club} (${formatDelta(c.weak_points)} WP: ${c.std_pts} STD vs ${c.dft_pts} DFT)`
      )
    : "";

  const wpLowText =
    lowestWpClub && (!topWpClub || lowestWpClub.club !== topWpClub.club)
      ? ` while ${lowestWpClub.club} posts the lowest Weak Points tally at ${formatDelta(lowestWpClub.weak_points)} WP`
      : "";

  const p2 =
    `The standard full-time standings present a contrasting picture, led by ${stdTopText}. ` +
    (stdRunnerUp
      ? `${stdLeader.club} stays ${Math.max(0, Number(stdLeader.std_pts ?? 0) - Number(stdRunnerUp.std_pts ?? 0))} points clear of ${stdRunnerUp.club} in full-time points, `
      : "") +
    (wpTopText
      ? `and Weak Points (STD minus DFT) show the largest positive cushions on ${wpTopText}${wpLowText}, reflecting points collected from draws or single-half wins.`
      : `showing how clubs that close out full matches can hold higher standard totals even when half-by-half tallies distribute points differently.`);

  const tailText = dftBottom3.length
    ? formatList(dftBottom3, (c) => `${c.club} (${c.dft_pts} pts, ${formatDelta(c.weak_points ?? 0)} WP)`)
    : `${tailClub.club} (${tailClub.dft_pts} pts)`;

  const stdTailText = stdBottom3.length
    ? formatList(stdBottom3, (c) => `${c.club} (${c.std_pts} pts)`)
    : "";

  const p3 =
    `At the opposite end of the ${leagueName} two-half table, ${tailText} sit under sustained points pressure` +
    (stdTailText ? `, while ${stdTailText} occupy the lower full-time spots.` : ".");

  const crossLeagueText = otherLeagues.slice(0, 7).length
    ? formatList(
        otherLeagues.slice(0, 7),
        (l) => {
          const wpNote =
            l.top_weak_points_club && Number.isFinite(Number(l.top_weak_points))
              ? `; max WP: ${l.top_weak_points_club} ${formatDelta(l.top_weak_points)}`
              : "";
          return `${l.name} (${l.dft_leader} on ${l.dft_leader_pts} two-half pts; ${l.std_leader} on ${l.std_leader_pts} full-time pts${wpNote})`;
        }
      )
    : "";

  const p4 = crossLeagueText
    ? `Across other tracked top-flight competitions on ${dateStr}, table leaders include ${crossLeagueText}.`
    : `Match tallies across tracked domestic leagues continue to update alongside ${leagueName} as fixtures conclude.`;

  // Write copyright-free SVG telemetry card to assets/cards/ftb-YYYY-MM-DD.svg
  let imageSrc = FOOTBALL_FALLBACK_BANNER;
  try {
    const relCardPath = path.posix.join("assets", "cards", `ftb-${dateStr}.svg`);
    const absCardPath = path.join(repoRoot || ".", "assets", "cards", `ftb-${dateStr}.svg`);
    const svgMarkup = generateFootballTelemetryCardSvg({
      dateStr,
      leagueName,
      leagueCode,
      focusTag,
      headline: title,
      rows: chartRows
    });
    fs.mkdirSync(path.dirname(absCardPath), { recursive: true });
    fs.writeFileSync(absCardPath, svgMarkup, "utf8");
    imageSrc = `${FOOTBALL_REPO_RAW_BASE}/${relCardPath}`;
  } catch (err) {
    console.warn(`Warning: Could not write Football telemetry SVG card: ${err.message}`);
  }

  return {
    title,
    summary,
    leadNarrative,
    storyBody: [p1, p2, p3, p4],
    labels: [
      "News Report",
      "Diploman Times",
      "Football Tally",
      leagueCode,
      `Angle ${angleId}`
    ],
    featuredImage: {
      src: imageSrc,
      alt: `${leagueName} Football Tally Telemetry — ${dateStr}`,
      target_url: DIPLOMAN_TIMES_URL
    }
  };
}

function buildJurisdictionDraft(vertical, selection, metrics, dateStr) {
  const isPolicing = vertical === "policingintel";
  const primaryKey = isPolicing ? "SPS" : "PSI";
  const secondaryKey = isPolicing ? "JTI" : "SIS";
  const metricLabel = isPolicing ? "Security Performance Score" : "Policy Signal Index";
  const secLabel = isPolicing ? "Jurisdiction Threat Index" : "State Instability Score";
  const verticalTag = isPolicing ? "Policing Intel" : "Governance Score";

  const angleId = selection.selected_angle_id || "01";
  const topEntity = metrics.top_primary_entity || "Lagos";
  const topScore = metrics.top_primary_score ?? 0;
  const maxPos = formatDelta(metrics.maxPositiveDelta);
  const maxNeg = formatDelta(metrics.maxNegativeDelta);

  const leaders = metrics.leaders || {};
  const primaryTop3 = Array.isArray(leaders.primary_top3) ? leaders.primary_top3 : [];
  const secondaryTop = Array.isArray(
    isPolicing ? leaders.secondary_top_watch : leaders.secondary_top3
  )
    ? isPolicing
      ? leaders.secondary_top_watch
      : leaders.secondary_top3
    : [];

  const jurisdictions = Array.isArray(metrics.jurisdictions) ? metrics.jurisdictions : [];
  const trailing = jurisdictions.slice(-3).reverse();

  const runnerUp = primaryTop3[1] || null;
  const leadMover =
    jurisdictions
      .slice()
      .sort((a, b) => Number(b[`${primaryKey}_delta`] ?? 0) - Number(a[`${primaryKey}_delta`] ?? 0))[0] ||
    null;

  let title;
  let summary;
  let leadNarrative;

  if (angleId === "02" && Number(metrics.maxNegativeDelta ?? 0) < 0) {
    const dropper =
      jurisdictions
        .slice()
        .sort((a, b) => Number(a[`${primaryKey}_delta`] ?? 0) - Number(b[`${primaryKey}_delta`] ?? 0))[0] ||
      { entity: topEntity, [`${primaryKey}_delta`]: maxNeg };
    const dropDelta = formatDelta(dropper[`${primaryKey}_delta`]);
    title = `${dropDelta} Shift Tests ${dropper.entity} as ${topEntity} Holds ${topScore} ${primaryKey} Lead`;
    summary =
      `${dropper.entity} recorded a ${dropDelta} ${primaryKey} movement while ${topEntity} retained first place on ${topScore} ${primaryKey}.`;
    leadNarrative =
      `${dropper.entity} experienced a ${dropDelta} ${primaryKey} drop across the 37 jurisdictions on ${dateStr}, ` +
      `even as ${topEntity} stayed atop the ${metricLabel} table on ${topScore} ${primaryKey}. ` +
      `Overall daily movement across tracked states ranged from ${maxNeg} to ${maxPos}.`;
  } else if (angleId === "06" && runnerUp) {
    title = `${topEntity} (${topScore} ${primaryKey}) Holds Narrow Lead Over ${runnerUp.entity} (${runnerUp.score} ${primaryKey})`;
    summary =
      `${topEntity} edges ${runnerUp.entity} (${runnerUp.score} ${primaryKey}) to keep the 37-jurisdiction ${primaryKey} lead at ${topScore}.`;
    leadNarrative =
      `A close margin at the top of the 37-jurisdiction ${metricLabel} standings places ${topEntity} on ${topScore} ${primaryKey} as of ${dateStr}, ` +
      `narrowly ahead of ${runnerUp.entity} on ${runnerUp.score} ${primaryKey}. ` +
      `Across all tracked jurisdictions, daily ${primaryKey} shifts spanned ${maxNeg} to ${maxPos}.`;
  } else {
    const moverEntity = leadMover ? leadMover.entity : topEntity;
    const moverDelta = leadMover ? formatDelta(leadMover[`${primaryKey}_delta`]) : maxPos;
    title = `${moverEntity} Posts ${moverDelta} ${primaryKey} Shift as ${topEntity} Leads on ${topScore} ${primaryKey}`;
    summary =
      `${moverEntity} registered a ${moverDelta} ${primaryKey} gain while ${topEntity} led the 37-jurisdiction rankings at ${topScore} ${primaryKey}.`;
    leadNarrative =
      `${moverEntity} logged the sharpest upward ${primaryKey} movement at ${moverDelta} on ${dateStr}, while ${topEntity} maintained the overall ${metricLabel} lead at ${topScore} ${primaryKey} across 37 jurisdictions. ` +
      `Daily changes across the federation ranged between ${maxNeg} and ${maxPos} ${primaryKey}.`;
  }

  const top3Text = primaryTop3.length
    ? formatList(
        primaryTop3,
        (r, idx) => `${idx + 1}. ${r.entity} (${r.score} ${primaryKey}, ${formatDelta(r.delta)})`
      )
    : `${topEntity} (${topScore} ${primaryKey})`;

  const p1 =
    `Leading ${metricLabel} positions across the 37 jurisdictions on ${dateStr} stand at ${top3Text}. ` +
    (runnerUp
      ? `${topEntity} holds a ${(Number(topScore) - Number(runnerUp.score ?? topScore)).toFixed(2).replace(/\.?0+$/, "")}-point margin over ${runnerUp.entity} in the primary ranking.`
      : `Daily ${primaryKey} readings reflect comparative performance across state commands and administrations.`);

  const secText = secondaryTop.length
    ? formatList(
        secondaryTop,
        (r) => `${r.entity} (${r.score} ${secondaryKey}, ${formatDelta(r.delta)})`
      )
    : "";

  const p2 = secText
    ? `On the ${secLabel} side, notable readings include ${secText}, ` +
      `highlighting jurisdictions where secondary risk or instability indicators behave differently from top ${primaryKey} totals.`
    : `Secondary ${secondaryKey} readings across the 37 jurisdictions continue to be tracked alongside ${primaryKey} movement.`;

  const trailingText = trailing.length
    ? formatList(
        trailing,
        (r) => `${r.entity} (${r[primaryKey]} ${primaryKey}, ${formatDelta(r[`${primaryKey}_delta`])})`
      )
    : "";

  const p3 = trailingText
    ? `Lower-ranked jurisdictions on the ${primaryKey} board include ${trailingText}, ` +
      `illustrating the spread between frontrunners and trailing states as of ${dateStr}.`
    : `Rankings across all 37 jurisdictions remain updated for ${dateStr}.`;

  const activeZones = jurisdictions.reduce((acc, r) => {
    const z = r.zone || "NC";
    acc[z] = (acc[z] || 0) + 1;
    return acc;
  }, {});

  const zoneSummary = Object.entries(activeZones)
    .map(([z, count]) => `${z} (${count})`)
    .join(", ");

  const p4 = zoneSummary
    ? `Regional distribution across geopolitical zones spans ${zoneSummary}, capturing broad subnational comparisons without relying on single-location snapshots.`
    : `Subnational comparisons span all 37 jurisdictions nationwide.`;

  return {
    title,
    summary,
    leadNarrative,
    storyBody: [p1, p2, p3, p4],
    labels: [
      "News Report",
      "Diploman Times",
      verticalTag,
      topEntity,
      `Angle ${angleId}`
    ],
    featuredImage: {
      src: "",
      alt: `${topEntity} ${verticalTag} Telemetry`,
      target_url: DIPLOMAN_TIMES_URL
    }
  };
}

function buildStoryDraft(vertical, selection, metrics, repoRoot) {
  const dateStr = selection.run_date_utc || metrics.run_date_utc || new Date().toISOString().slice(0, 10);
  if (vertical === "footballtally") {
    return buildFootballDraft(selection, metrics, dateStr, repoRoot);
  }
  return buildJurisdictionDraft(vertical, selection, metrics, dateStr);
}

function queueScoredBrief({ vertical, selectionPath, metricsPath, queuePath }) {
  const selection = loadJson(selectionPath, null);
  if (!selection) {
    throw new Error(`Missing angle selection file at: ${selectionPath}`);
  }
  const metrics = loadJson(metricsPath, {});
  const existingQueue = loadJson(queuePath, { newsReports: [] });
  const repoRoot = path.dirname(path.resolve(queuePath));

  const prefixMap = {
    governancescore: "scored-gov",
    footballtally: "scored-ftb",
    policingintel: "scored-pol"
  };
  const prefix = prefixMap[vertical] || `scored-${vertical}`;
  const runDate = selection.run_date_utc || metrics.run_date_utc || new Date().toISOString().slice(0, 10);
  const angleId = selection.selected_angle_id || "01";
  // Key by vertical + runDate so re-runs on the same UTC date never create duplicate queued posts
  const dailySlotId = `${prefix}-${runDate}`;

  const existingList = Array.isArray(existingQueue)
    ? existingQueue
    : Array.isArray(existingQueue.newsReports)
    ? existingQueue.newsReports
    : Array.isArray(existingQueue.items)
    ? existingQueue.items
    : [];

  // If today's UTC slot for this vertical was already published, lock it and do not re-queue
  const alreadyPublishedToday = existingList.find(
    (item) =>
      item &&
      String(item.vertical || "").toLowerCase() === vertical &&
      item.published === true &&
      (item.id === dailySlotId ||
        String(item.id || "").startsWith(`${dailySlotId}-`) ||
        item.run_date_utc === runDate ||
        item.published_utc_date === runDate)
  );

  if (alreadyPublishedToday) {
    return {
      status: "SKIPPED_ALREADY_PUBLISHED_TODAY",
      run_date_utc: runDate,
      vertical,
      existing_id: alreadyPublishedToday.id
    };
  }

  const draft = buildStoryDraft(vertical, selection, metrics, repoRoot);

  const entry = {
    type: "scored_brief",
    id: dailySlotId,
    run_date_utc: runDate,
    published: false,
    target_url: DIPLOMAN_TIMES_URL,
    vertical,
    source_domain: selection.domain || DIPLOMAN_TIMES_URL,
    angle_id: angleId,
    angle_family: selection.family || "general",
    opening_class: selection.opening_class || "entity_first",
    headline_skeleton: selection.headline_skeleton || "",
    lede_rule: selection.lede_rule || "",
    ...(vertical === "footballtally" && selection.weak_points_context
      ? { weak_points_context: selection.weak_points_context }
      : {}),
    title: draft.title,
    summary: draft.summary,
    labels: draft.labels,
    featured_image: draft.featuredImage,
    lead_narrative: draft.leadNarrative,
    story_body: draft.storyBody,
    queued_at_utc: new Date().toISOString()
  };

  // Remove any earlier unpublished entry for this same vertical + UTC date so only 1 draft exists per day
  const filteredList = existingList.filter((item) => {
    if (!item) return false;
    const sameVertical = String(item.vertical || "").toLowerCase() === vertical;
    const sameDate =
      item.id === dailySlotId ||
      String(item.id || "").startsWith(`${dailySlotId}-`) ||
      item.run_date_utc === runDate;
    return !(sameVertical && sameDate && !item.published);
  });

  const updatedReports = [entry, ...filteredList];
  saveJson(queuePath, { newsReports: updatedReports });

  return {
    status: "QUEUED",
    target_url: DIPLOMAN_TIMES_URL,
    entry
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (flag, def = "") => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
  };

  try {
    const vertical = getArg("--vertical", "footballtally");
    const selectionPath = getArg("--selection", path.join("state", vertical, "latest_selection.json"));
    const metricsPath = getArg("--metrics", path.join("state", vertical, "daily_metrics_summary.json"));
    const queuePath = getArg("--queue", "news-queue.json");

    const result = queueScoredBrief({ vertical, selectionPath, metricsPath, queuePath });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ status: "ERROR", message: err.message }, null, 2));
    process.exit(1);
  }
}

module.exports = { queueScoredBrief };
