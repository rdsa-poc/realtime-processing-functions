import http from "node:http";
import { pathToFileURL } from "node:url";

import { loadAppConfig, type AppConfig } from "./shared/config.ts";
import {
  createApplicationEventHandler,
  describeHttpFunction,
  matchHttpFunction,
} from "./functions/onApplicationEvent.ts";

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
): Promise<void> | void {
  if (request.method === "GET" && request.url === "/") {
    const applicationEventHandler = createApplicationEventHandler();
    jsonResponse(response, 200, {
      environmentName: config.environmentName,
      functions: [describeHttpFunction(applicationEventHandler)],
      runtime: "firebase-function-shell",
      service: "rt-fn",
      status: "ok",
    });
    return;
  }

  const matchedFunction = matchHttpFunction(request.method, request.url);
  if (matchedFunction !== undefined) {
    return readJsonBody(request)
      .then((payload) => matchedFunction.respond(payload))
      .then((payload) => {
        jsonResponse(response, 202, payload);
      })
      .catch((error: unknown) => {
        jsonResponse(response, 400, {
          error: "Invalid JSON payload",
          message: error instanceof Error ? error.message : String(error),
        });
      });
  }

  const applicationEventHandler = createApplicationEventHandler();
  jsonResponse(response, 404, {
    availableFunctions: [describeHttpFunction(applicationEventHandler)],
    error: "Not Found",
  });
}

export function createServer(config: AppConfig): http.Server {
  return http.createServer((request, response) => {
    void handleRequest(request, response, config);
  });
}

export function startServer(config: AppConfig): Promise<http.Server> {
  const server = createServer(config);
  return new Promise((resolve) => {
    server.listen(config.port, config.host, () => resolve(server));
  });
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  const config = loadAppConfig();
  await startServer(config);
  console.log(
    `rt-fn firebase-aligned shell listening on http://${config.host}:${config.port} for ${config.environmentName}`,
  );
}

function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    request.on("data", (chunk) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    request.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8").trim();
      if (rawBody === "") {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}
