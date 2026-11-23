// scripts/validate_inputs.js — Validates Daily Metrics Against Contract Rules
const fs = require("fs");
const path = require("path");

function loadJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveContractPath(vertical, explicitPath = "") {
  if (explicitPath) return explicitPath;
  const map = {
    governancescore: path.join("config", "governance-contract.json"),
    footballtally: path.join("config", "football-contract.json"),
    policingintel: path.join("config", "policing-contract.json")
  };
  return map[vertical] || path.join("config", `${vertical}-contract.json`);
}

function validateInputs({ vertical, runDateUtc, metricsPath, contractPath }) {
  const errors = [];
  const contract = loadJson(contractPath);
  if (!contract) {
    return {
      valid: false,
      errors: [`Missing vertical contract file at: ${contractPath}`]
    };
  }

  const metrics = loadJson(metricsPath);
  if (!metrics || typeof metrics !== "object") {
    return {
      valid: false,
      errors: [`Missing or unreadable daily metrics summary at: ${metricsPath}`]
    };
  }

  if (metrics.vertical !== vertical) {
    errors.push(`Expected vertical "${vertical}", received "${metrics.vertical}".`);
  }

  if (runDateUtc && metrics.run_date_utc !== runDateUtc) {
    errors.push(`Payload run_date_utc ("${metrics.run_date_utc}") does not match run date ("${runDateUtc}").`);
  }

  const requiredFields = contract.required_summary_fields || [
    "run_date_utc",
    "vertical",
    "top_primary_entity",
    "top_primary_score"
  ];
  for (const field of requiredFields) {
    if (metrics[field] === undefined || metrics[field] === null || metrics[field] === "") {
      errors.push(`Missing required summary field: ${field}`);
    }
  }

  if (contract.coverage && contract.coverage.scope_type === "jurisdictions") {
    const expectedCount = contract.coverage.expected_count || 37;
    if (metrics.jurisdiction_count !== expectedCount) {
      errors.push(
        `Expected ${expectedCount} jurisdictions for ${vertical}, received ${metrics.jurisdiction_count}.`
      );
    }
  }

  if (contract.coverage && contract.coverage.scope_type === "leagues") {
    const expectedLeagues = contract.coverage.expected_league_count || 8;
    const leagues = Array.isArray(metrics.leagues) ? metrics.leagues : [];
    if (leagues.length !== expectedLeagues) {
      errors.push(`Expected ${expectedLeagues} leagues for ${vertical}, received ${leagues.length}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    contract,
    metrics
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (flag, def = "") => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
  };

  const vertical = getArg("--vertical", "footballtally");
  const runDateUtc = getArg("--date", "");
  const metricsPath = getArg(
    "--metrics",
    path.join("state", vertical, "daily_metrics_summary.json")
  );
  const contractPath = resolveContractPath(vertical, getArg("--contract", ""));

  const res = validateInputs({ vertical, runDateUtc, metricsPath, contractPath });
  if (!res.valid) {
    console.error(
      JSON.stringify(
        {
          status: "INVALID",
          errors: res.errors
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: "VALID",
        vertical,
        run_date_utc: res.metrics.run_date_utc,
        top_primary_entity: res.metrics.top_primary_entity,
        top_primary_score: res.metrics.top_primary_score
      },
      null,
      2
    )
  );
}

module.exports = { validateInputs, resolveContractPath };
