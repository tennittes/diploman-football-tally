// scripts/queue_scored_brief.js — Queues Scored Brief Into news-queue.json Targeting Diploman Times
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

  if (vertical === "footballtally") {
    const leagueName = metrics.active_league_name || "Premier League";
    const leagueCode = metrics.active_league_code || "PL";
    const stdTop =
      (metrics.active_league_standings &&
        metrics.active_league_standings.std_top3 &&
        metrics.active_league_standings.std_top3[0]) ||
      null;
    const stdLeaderName = stdTop ? stdTop.club : topEntity;
    const stdLeaderPts = stdTop ? stdTop.std_pts : topScore;

    const title = `${topEntity} Leads ${leagueName} DFT Tally on ${topScore} Pts as ${stdLeaderName} Tops Full-Time Table (${stdLeaderPts} Pts)`;
    const summary =
      `${topEntity} holds the Diploman Football Tally (DFT) lead in ${leagueName} (${leagueCode}) with ${topScore} two-half points as of ${dateStr} UTC, ` +
      `while ${stdLeaderName} leads the standard full-time table on ${stdLeaderPts} points.`;

    return {
      title,
      summary,
      labels: [
        "News Report",
        "Diploman Times",
        "Football Tally",
        leagueCode,
        `Angle ${selection.selected_angle_id}`
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
        `Angle ${selection.selected_angle_id}`
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
      `Angle ${selection.selected_angle_id}`
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
  const existingQueue = loadJson(queuePath, []);
  const queueList = Array.isArray(existingQueue)
    ? existingQueue
    : Array.isArray(existingQueue.items)
    ? existingQueue.items
    : [];

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
    queued_at_utc: new Date().toISOString()
  };

  const filtered = queueList.filter((item) => item.id !== id);
  const updatedQueue = [entry, ...filtered];
  saveJson(queuePath, updatedQueue);

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
