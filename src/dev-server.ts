import http from "node:http";
import { pathToFileURL } from "node:url";

import { loadAppConfig, type AppConfig } from "./config.ts";
import {
  buildSmokeFlowRealtimeState,
  projectQuizChange,
  recordParticipantSubmission,
} from "./index.ts";

function jsonResponse(
  response: http.ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function handleRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  config: AppConfig,
): void {
  if (request.method === "GET" && request.url === "/health") {
    jsonResponse(response, 200, {
      environmentName: config.environmentName,
      service: "rt-fn",
      status: "ok",
      upstream: config.backofficeBaseUrl,
    });
    return;
  }

  if (request.method === "GET" && request.url === "/bootstrap/smoke-flow") {
    jsonResponse(response, 200, buildSmokeFlowRealtimeState(config.backofficeBaseUrl));
    return;
  }

  if (request.method === "POST" && request.url === "/quiz-change") {
    jsonResponse(
      response,
      202,
      projectQuizChange({
        quizId: "quiz-smoke-demo",
        changeType: "configuration-update",
      }),
    );
    return;
  }

  if (request.method === "POST" && request.url === "/participant-submissions") {
    jsonResponse(
      response,
      202,
      recordParticipantSubmission({
        quizId: "quiz-smoke-demo",
        participantId: "participant-smoke-demo",
        answerId: "answer-smoke-a",
      }),
    );
    return;
  }

  jsonResponse(response, 404, { error: "Not Found" });
}

export function createServer(config: AppConfig): http.Server {
  return http.createServer((request, response) => handleRequest(request, response, config));
}

export function startServer(config: AppConfig): Promise<http.Server> {
  const server = createServer(config);
  return new Promise((resolve) => {
    server.listen(config.port, () => resolve(server));
  });
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  const config = loadAppConfig();
  await startServer(config);
  console.log(
    `rt-fn shell listening on http://localhost:${config.port} for ${config.environmentName}`,
  );
}
