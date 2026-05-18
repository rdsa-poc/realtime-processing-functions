import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  MissingConfigurationError,
  parseEnvironmentFile,
  resolveAppConfig,
} from "../src/config.ts";
import {
  buildSmokeFlowRealtimeState,
  projectQuizChange,
  recordParticipantSubmission,
} from "../src/index.ts";

const envExampleUrl = new URL("../.env.example", import.meta.url);
const packageJsonUrl = new URL("../package.json", import.meta.url);
const readmeUrl = new URL("../README.md", import.meta.url);

// Test: exposes the realtime processing boundary and documented startup commands.
// Validates: RDS-AC-003 (RDS-REQ-015 - Provide a runnable application skeleton for rt-fn)
test("realtime functions scaffold exposes the expected handlers", () => {
  const projected = projectQuizChange({
    quizId: "quiz-1",
    changeType: "configuration-update",
  });
  const recorded = recordParticipantSubmission({
    quizId: "quiz-1",
    participantId: "participant-1",
    answerId: "answer-1",
  });

  assert.equal(projected.target, "realtime-quiz-data");
  assert.equal(projected.accepted, true);
  assert.equal(recorded.analyticsSink, "bigquery");
  assert.equal(recorded.accepted, true);
});

// Test: exposes the realtime-side bootstrap contract used by the scaffold smoke flow.
// Validates: RDS-AC-011, RDS-AC-012 (RDS-REQ-023 - Provide a minimal cross-application smoke flow, RDS-REQ-024 - Provide bootstrap data for the initial smoke flow)
test("realtime functions scaffold exposes smoke flow bootstrap state", () => {
  const smokeFlowState = buildSmokeFlowRealtimeState("http://localhost:8080");

  assert.equal(smokeFlowState.smokeFlowId, "baseline-smoke-flow");
  assert.equal(smokeFlowState.upstreamBackofficeUrl, "http://localhost:8080");
  assert.equal(smokeFlowState.quizProjection.quizId, "quiz-smoke-demo");
  assert.equal(smokeFlowState.mobileStream.streamId, "stream-smoke-demo");
  assert.equal(smokeFlowState.participantSubmission.participantId, "participant-smoke-demo");
  assert.equal(smokeFlowState.analyticsSink, "bigquery");
});

// Test: publishes the required development entrypoints.
// Validates: RDS-AC-003 (RDS-REQ-015 - Provide a runnable application skeleton for rt-fn)
test("realtime functions scaffold declares startup commands", () => {
  const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8")) as {
    scripts: Record<string, string>;
  };
  const readme = readFileSync(readmeUrl, "utf8");

  assert.equal(packageJson.scripts.dev, "node --watch --experimental-strip-types src/dev-server.ts");
  assert.equal(packageJson.scripts.start, "node --experimental-strip-types src/dev-server.ts");
  assert.match(readme, /npm run dev/);
  assert.match(readme, /npm run start/);
  assert.match(readme, /http:\/\/localhost:5001/);
});

// Test: resolves the shared local configuration convention from the committed example file.
// Validates: RDS-AC-005 (RDS-REQ-017 - Define a shared environment configuration convention)
test("realtime functions scaffold resolves the documented environment convention", () => {
  const environment = parseEnvironmentFile(readFileSync(envExampleUrl, "utf8"));
  const config = resolveAppConfig(environment);
  const readme = readFileSync(readmeUrl, "utf8");

  assert.equal(config.appId, "rt-fn");
  assert.equal(config.environmentName, "local");
  assert.equal(config.backofficeBaseUrl, "http://localhost:8080");
  assert.match(readme, /copy `\.env\.example` to `\.env\.local`/i);
  assert.match(readme, /RADIOSA_ENVIRONMENT/);
  assert.match(readme, /RADIOSA_BACKOFFICE_BASE_URL/);
});

// Test: reports exactly which required configuration values are missing.
// Validates: RDS-AC-006 (RDS-REQ-018 - Report missing required configuration values)
test("realtime functions scaffold reports missing configuration keys", () => {
  assert.throws(
    () => resolveAppConfig({ RADIOSA_APP_ID: "rt-fn" }),
    (error: unknown) => {
      assert.ok(error instanceof MissingConfigurationError);
      assert.deepEqual(error.missingKeys, ["RADIOSA_ENVIRONMENT", "RADIOSA_BACKOFFICE_BASE_URL"]);
      assert.match(
        error.message,
        /Missing required configuration values for rt-fn: RADIOSA_ENVIRONMENT, RADIOSA_BACKOFFICE_BASE_URL/,
      );
      return true;
    },
  );
});
