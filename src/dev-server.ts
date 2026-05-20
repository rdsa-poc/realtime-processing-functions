import http from "node:http";
import { pathToFileURL } from "node:url";

import { loadAppConfig, type AppConfig } from "./config.ts";
import {
  describeHttpFunction,
  firebaseHttpFunctions,
  matchHttpFunction,
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
  if (request.method === "GET" && request.url === "/") {
    jsonResponse(response, 200, {
      environmentName: config.environmentName,
      functions: firebaseHttpFunctions.map(describeHttpFunction),
      runtime: "firebase-function-shell",
      service: "rt-fn",
      status: "ok",
      upstream: {
        backofficeBaseUrl: config.backofficeBaseUrl,
      },
    });
    return;
  }

  const matchedFunction = matchHttpFunction(request.method, request.url);
  if (matchedFunction !== undefined) {
    jsonResponse(
      response,
      matchedFunction.statusCode,
      matchedFunction.respond(config, request),
    );
    return;
  }

  jsonResponse(response, 404, {
    availableFunctions: firebaseHttpFunctions.map(describeHttpFunction),
    error: "Not Found",
  });
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
    `rt-fn firebase-aligned shell listening on http://localhost:${config.port} for ${config.environmentName}`,
  );
}
