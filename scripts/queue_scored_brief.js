// scripts/queue_scored_brief.js — Queues Angle-Matched Scored Brief Into news-queue.json Targeting Diploman Times
const fs = require("fs");
const path = require("path");

const DIPLOMAN_TIMES_URL = "https://www.diplomantimes.com";

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function formatDelta(val) {
  const n = Number(val || 0);
  if (n > 0) return `+${n}`;
  return `${n}`;
}

function buildStoryDraft(vertical, selection, metrics) {
  const dateStr = selection.run_date_utc || metrics.run_date_utc;
  const topEntity = metrics.top_primary_entity || "Top Leader";
  const topScore = metrics.top_primary_score ?? 0;
  const angleId = selection.selected_angle_id || "04";

  if (vertical === "footballtally") {
    const leagueName = metrics.active_league_name || "Premier League";
    const leagueCode = metrics.active_league_code || "PL";
    const standings = metrics.active_league_standings || {};
    const dftTop3 = standings.dft_top3 || [];
    const dftBottom3 = standings.dft_bottom3 || [];
    const stdTop = (standings.std_top3 && standings.std_top3[0]) || null;

    const runnerUp = dftTop3[1] || { club: "Chasers", dft_pts: topScore };
    const tailClub = dftBottom3[0] || { club: "Bottom Tier", dft_pts: 0 };
    const stdLeaderName = stdTop ? stdTop.club : topEntity;
    const stdLeaderPts = stdTop ? stdTop.std_pts : topScore;

    let title;
    let summary;

    switch (angleId) {
      case "07": // tail_first — Lower-Tier Pressure Persists as [Entity] Stays Ahead
        title = `Lower-Tier Pressure Persists on ${tailClub.club} (${tailClub.dft_pts} Pts) as ${topEntity} Stays Ahead on ${topScore} DFT Pts`;
        summary =
          `${tailClub.club} remains anchored at the foot of the ${leagueName} (${leagueCode}) two-half table on ${tailClub.dft_pts} points while ${topEntity} leads on ${topScore} points as of ${dateStr} UTC. ` +
          `Across the table split, ${stdLeaderName} paces the standard full-time standings on ${stdLeaderPts} points.`;
        break;

      case "04": // contrast_first
      case "09": // metric_first (DFT vs STD divergence)
        title = `${topEntity} Tops ${leagueName} DFT Tally (${topScore} Pts) While ${stdLeaderName} Leads Full-Time Table (${stdLeaderPts} Pts)`;
        summary =
          `${topEntity} holds the Diploman Football Tally (DFT) lead in ${leagueName} (${leagueCode}) with ${topScore} two-half points as of ${dateStr} UTC, ` +
          `while ${stdLeaderName} leads the standard full-time table on ${stdLeaderPts} points.`;
        break;

      case "06": // entity_first — Tight Top-Three Race
        title = `${topEntity} (${topScore} Pts) Edges Narrow Lead Over ${runnerUp.club} (${runnerUp.dft_pts} Pts) in ${leagueName} DFT Race`;
        summary =
          `${topEntity} holds a slim margin on ${topScore} two-half points ahead of ${runnerUp.club} (${runnerUp.dft_pts} pts) in ${leagueName} (${leagueCode}) as of ${dateStr} UTC. ` +
          `On the full-time table, ${stdLeaderName} sets the pace with ${stdLeaderPts} points.`;
        break;

      default: // 01, 02, 03, 05, 08, 10
        title = `${topEntity} Holds ${leagueName} DFT Lead on ${topScore} Pts Ahead of ${runnerUp.club} (${runnerUp.dft_pts} Pts)`;
        summary =
          `${topEntity} leads the ${leagueName} (${leagueCode}) Diploman Football Tally on ${topScore} two-half points ahead of ${runnerUp.club} (${runnerUp.dft_pts} pts) as of ${dateStr} UTC, ` +
          `while ${stdLeaderName} tops the standard full-time table on ${stdLeaderPts} points.`;
        break;
    }

    return {
      title,
      summary,
      leagueName,
      leagueCode,
      stdLeaderName,
      stdLeaderPts,
      labels: [
        "News Report",
        "Diploman Times",
        "Football Tally",
        leagueCode,
        `Angle ${angleId}`
      ],
      featured_image: {
        src: "",
        alt: `${leagueName} Diploman Football Tally Standings`,
        target_url: DIPLOMAN_TIMES_URL
      }
    };
  }

  if (vertical === "policingintel") {
    const deltaStr = formatDelta(metrics.maxPositiveDelta);
    const title = `${topEntity} Posts ${topScore} SPS Lead With ${deltaStr} Shift in Policing Intel`;
    const summary =
      `${topEntity} leads the 37-jurisdiction Security Performance Score (SPS) table at ${topScore} (peak daily shift ${deltaStr}) as of ${dateStr} UTC.`;

    return {
      title,
      summary,
      labels: [
        "News Report",
        "Diploman Times",
        "Policing Intel",
        topEntity,
        `Angle ${angleId}`
      ],
      featured_image: {
        src: "",
        alt: `${topEntity} Subnational Policing Intelligence Scorecard`,
        target_url: DIPLOMAN_TIMES_URL
      }
    };
  }

  const deltaStr = formatDelta(metrics.maxPositiveDelta);
  const title = `${topEntity} Posts ${deltaStr} Policy Surge to ${topScore} PSI as ${topEntity} Holds Subnational Lead`;
  const summary =
    `${topEntity} leads the 37-jurisdiction Policy Signal Index (PSI) table at ${topScore} (${deltaStr}) as of ${dateStr} UTC.`;

  return {
    title,
    summary,
    labels: [
      "News Report",
      "Diploman Times",
      "Governance Score",
      topEntity,
      `Angle ${angleId}`
    ],
    featured_image: {
      src: "",
      alt: `${topEntity} Subnational Governance Score Telemetry`,
      target_url: DIPLOMAN_TIMES_URL
    }
  };
}

function queueScoredBrief({ vertical, selectionPath, metricsPath, queuePath }) {
  const selection = loadJson(selectionPath, null);
  if (!selection) {
    throw new Error(`Missing angle selection file at: ${selectionPath}`);
  }
  const metrics = loadJson(metricsPath, {});
  const existingQueue = loadJson(queuePath, { newsReports: [] });

  const prefixMap = {
    governancescore: "scored-gov",
    footballtally: "scored-ftb",
    policingintel: "scored-pol"
  };
  const prefix = prefixMap[vertical] || `scored-${vertical}`;
  const runDate = selection.run_date_utc || metrics.run_date_utc || new Date().toISOString().slice(0, 10);
  const angleId = selection.selected_angle_id || "01";
  const id = `${prefix}-${runDate}-${angleId}`;

  const draft = buildStoryDraft(vertical, selection, metrics);
  const topEntity = metrics.top_primary_entity || "Top Leader";
  const topScore = metrics.top_primary_score ?? 0;

  const entry = {
    type: "scored_brief",
    id,
    published: false,
    target_url: DIPLOMAN_TIMES_URL,
    vertical,
    source_domain: selection.domain || DIPLOMAN_TIMES_URL,
    angle_id: angleId,
    angle_family: selection.family || "general",
    opening_class: selection.opening_class || "entity_first",
    headline_skeleton: selection.headline_skeleton || "",
    lede_rule: selection.lede_rule || "",
    title: draft.title,
    summary: draft.summary,
    labels: draft.labels,
    featured_image: draft.featured_image,
    lead_narrative: draft.summary,
    editorial_notice:
      "This Scored Intelligence Brief translates two-half Diploman Football Tally (DFT) and standard full-time (STD) match telemetry into verified coverage for Diploman Times.",
    story_body:
      vertical === "footballtally"
        ? [
            `Structured under Angle ${angleId} (${selection.family || "execution_momentum"}), ${draft.leagueName} (${draft.leagueCode}) telemetry places ${topEntity} atop the two-half DFT table on ${topScore} points.`,
            `On the standard full-time (3-1-0) table, ${draft.stdLeaderName} holds first place on ${draft.stdLeaderPts} points, highlighting divergence between half-by-half control and full-time outcomes.`,
            "Each DFT fixture awards 1 point per half won plus a 1-point bonus for sweeping both halves across tracked top-flight competitions."
          ]
        : [draft.summary],
    queued_at_utc: new Date().toISOString()
  };

  const existingList = Array.isArray(existingQueue)
    ? existingQueue
    : Array.isArray(existingQueue.newsReports)
    ? existingQueue.newsReports
    : Array.isArray(existingQueue.items)
    ? existingQueue.items
    : [];

  const updatedReports = [entry, ...existingList.filter((item) => item.id !== id)];
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
