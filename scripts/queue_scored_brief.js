const entry = {
    type: "scored_brief",
    id,
    published: false,
    vertical,
    source_domain: selection.domain || DIPLOMAN_TIMES_URL,
    angle_id: angleId,
    angle_family: selection.family || "general",
    opening_class: selection.opening_class || "entity_first",
    headline_skeleton: selection.headline_skeleton || "",
    lede_rule: selection.lede_rule || "",
    title: draft.title,
    labels: draft.labels,
    featured_image: draft.featured_image,
    lead_narrative: draft.summary,
    editorial_notice:
      "This Scored Intelligence Brief translates two-half Diploman Football Tally (DFT) and standard full-time (STD) match telemetry into verified coverage for Diploman Times.",
    story_body: [
      `Structured under Angle ${angleId} (${selection.family || "execution_momentum"}), ${leagueName} (${leagueCode}) telemetry places ${topEntity} atop the two-half DFT table on ${topScore} points.`,
      `On the standard full-time (3-1-0) table, ${stdLeaderName} holds first place on ${stdLeaderPts} points, highlighting divergence between half-by-half control and full-time outcomes.`,
      `Each DFT fixture awards 1 point per half won plus a 1-point bonus for sweeping both halves across tracked top-flight competitions.`
    ],
    queued_at_utc: new Date().toISOString()
  };

  const existingList = Array.isArray(existingQueue)
    ? existingQueue
    : Array.isArray(existingQueue.newsReports)
    ? existingQueue.newsReports
    : [];

  const updatedReports = [entry, ...existingList.filter((item) => item.id !== id)];
  saveJson(queuePath, { newsReports: updatedReports });
