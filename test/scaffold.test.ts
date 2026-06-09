import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  MissingConfigurationError,
  parseEnvironmentFile,
  resolveAppConfig,
} from "../src/shared/config.ts";
import {
  onApplicationEvent,
} from "../src/index.ts";
import {
  createApplicationEventHandler,
  describeHttpFunction,
  matchHttpFunction,
} from "../src/functions/onApplicationEvent.ts";

const sharedEnvUrl = new URL("../../.env", import.meta.url);
const packageJsonUrl = new URL("../package.json", import.meta.url);
const readmeUrl = new URL("../README.md", import.meta.url);
const indexUrl = new URL("../src/index.ts", import.meta.url);

// Test: exposes only the single baseline application event entrypoint.
// Validates: RDS-AC-051, RDS-AC-052, RDS-AC-053 (RDS-REQ-059 - Expose a baseline Firebase Functions export surface for rt-fn, RDS-REQ-060 - Export exactly one Firebase Function named onApplicationEvent, RDS-REQ-061 - Accept an unconstrained Event parameter in onApplicationEvent)
test("realtime functions scaffold exposes only onApplicationEvent", async () => {
  const moduleExports = await import(indexUrl.href);
  const handledEvent = await onApplicationEvent({
    eventName: "app.startup",
    source: "app",
  });

  assert.deepEqual(Object.keys(moduleExports).sort(), ["onApplicationEvent"]);
  assert.equal(typeof onApplicationEvent, "function");
  assert.equal(handledEvent.accepted, true);
  assert.deepEqual(handledEvent.Event, {
    eventName: "app.startup",
    source: "app",
  });
});

// Test: publishes the required development entrypoints.
// Validates: RDS-AC-003, RDS-AC-051 (RDS-REQ-015 - Provide a runnable application skeleton for rt-fn, RDS-REQ-059 - Expose a baseline Firebase Functions export surface for rt-fn)
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
  assert.match(readme, /curl/i);
  assert.match(readme, /\/onApplicationEvent/);
  assert.doesNotMatch(readme, /\/bootstrapSmokeFlow/);
  assert.doesNotMatch(readme, /\/handleParticipantSubmission/);
});

// Test: resolves the shared local configuration convention from the shared root contract file.
// Validates: RDS-AC-005, RDS-AC-060 (RDS-REQ-017 - Define a shared environment configuration convention, RDS-REQ-071 - Define RT_FN_BASE_URL in the shared .env file)
test("realtime functions scaffold resolves the documented environment convention", () => {
  const environment = parseEnvironmentFile(readFileSync(sharedEnvUrl, "utf8"));
  const config = resolveAppConfig(environment);
  const readme = readFileSync(readmeUrl, "utf8");

  assert.equal(config.appId, "rt-fn");
  assert.equal(config.environmentName, "local");
  assert.match(readme, /shared root `\.env` file/i);
  assert.match(readme, /RADIOSA_ENVIRONMENT/);
  assert.match(readme, /RT_FN_BASE_URL/);
  assert.doesNotMatch(readme, /BOF_BE_BASE_URL/);
  assert.match(readFileSync(sharedEnvUrl, "utf8"), /^RT_FN_BASE_URL=http:\/\/localhost:5001$/m);
});

// Test: reports exactly which required configuration values are missing.
// Validates: RDS-AC-006 (RDS-REQ-018 - Report missing required configuration values)
test("realtime functions scaffold reports missing configuration keys", () => {
  assert.throws(
    () => resolveAppConfig({}),
    (error: unknown) => {
      assert.ok(error instanceof MissingConfigurationError);
      assert.deepEqual(error.missingKeys, ["RADIOSA_ENVIRONMENT"]);
      assert.match(
        error.message,
        /Missing required configuration value for rt-fn: RADIOSA_ENVIRONMENT/,
      );
      return true;
    },
  );
});

// Test: routes the local shell through the single application event entrypoint without domain processing.
// Validates: RDS-AC-054, RDS-AC-055, RDS-AC-057 (RDS-REQ-062 - Accept emulator invocation without domain-specific processing, RDS-REQ-063 - Limit the Firebase Functions surface to local integration demonstration, RDS-REQ-065 - Accept the app startup Event from onApplicationEvent)
test("realtime functions scaffold accepts startup events through the single local route", async () => {
  const handler = createApplicationEventHandler();
  const describedHandler = describeHttpFunction(handler);
  const matchedHandler = matchHttpFunction("POST", "/onApplicationEvent");
  const startupEvent = {
    Event: {
      eventName: "app.startup",
      source: "app",
    },
  };

  assert.deepEqual(describedHandler, {
    functionName: "onApplicationEvent",
    method: "POST",
    route: "/onApplicationEvent",
  });
  assert.equal(matchHttpFunction("GET", "/onApplicationEvent"), undefined);
  assert.ok(matchedHandler !== undefined);
  assert.deepEqual(await handler.respond(startupEvent), {
    accepted: true,
    Event: startupEvent.Event,
  });
  assert.deepEqual(await matchedHandler.respond(startupEvent), {
    accepted: true,
    Event: startupEvent.Event,
  });
});
