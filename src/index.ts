import type http from "node:http";

import type { AppConfig } from "./config.ts";

export type QuizChange = {
  quizId: string;
  changeType: "configuration-update" | "lifecycle-action";
};

export type ParticipantSubmission = {
  quizId: string;
  participantId: string;
  answerId: string;
};

export type SmokeFlowRealtimeState = {
  analyticsSink: string;
  mobileStream: {
    status: string;
    streamId: string;
    title: string;
  };
  participantSubmission: ParticipantSubmission;
  quizProjection: ReturnType<typeof projectQuizChange>;
  smokeFlowId: string;
  upstreamBackofficeUrl: string;
};

export type HttpFunctionDefinition = {
  functionName: string;
  method: "GET" | "POST";
  routes: readonly string[];
  statusCode: number;
  respond: (config: AppConfig, request: http.IncomingMessage) => unknown;
};

export function projectQuizChange(change: QuizChange) {
  return {
    target: "realtime-quiz-data",
    accepted: true,
    quizId: change.quizId,
    changeType: change.changeType,
  };
}

export function recordParticipantSubmission(submission: ParticipantSubmission) {
  return {
    accepted: true,
    participantId: submission.participantId,
    quizId: submission.quizId,
    answerId: submission.answerId,
    analyticsSink: "bigquery",
  };
}

export function buildSmokeFlowRealtimeState(
  backofficeBaseUrl: string,
): SmokeFlowRealtimeState {
  return {
    analyticsSink: "bigquery",
    mobileStream: {
      status: "Ready for bootstrap",
      streamId: "stream-smoke-demo",
      title: "Smoke Flow Demo Stream",
    },
    participantSubmission: {
      answerId: "answer-smoke-a",
      participantId: "participant-smoke-demo",
      quizId: "quiz-smoke-demo",
    },
    quizProjection: projectQuizChange({
      quizId: "quiz-smoke-demo",
      changeType: "configuration-update",
    }),
    smokeFlowId: "baseline-smoke-flow",
    upstreamBackofficeUrl: backofficeBaseUrl,
  };
}

export const health = defineHttpFunction({
  functionName: "health",
  method: "GET",
  routes: ["/health"],
  statusCode: 200,
  respond: (config) => ({
    environmentName: config.environmentName,
    service: "rt-fn",
    status: "ok",
    upstream: config.backofficeBaseUrl,
  }),
});

export const bootstrapSmokeFlow = defineHttpFunction({
  functionName: "bootstrapSmokeFlow",
  method: "GET",
  routes: ["/bootstrapSmokeFlow", "/bootstrap/smoke-flow"],
  statusCode: 200,
  respond: (config) => buildSmokeFlowRealtimeState(config.backofficeBaseUrl),
});

export const handleQuizChange = defineHttpFunction({
  functionName: "handleQuizChange",
  method: "POST",
  routes: ["/handleQuizChange", "/quiz-change"],
  statusCode: 202,
  respond: () =>
    projectQuizChange({
      quizId: "quiz-smoke-demo",
      changeType: "configuration-update",
    }),
});

export const handleParticipantSubmission = defineHttpFunction({
  functionName: "handleParticipantSubmission",
  method: "POST",
  routes: ["/handleParticipantSubmission", "/participant-submissions"],
  statusCode: 202,
  respond: () =>
    recordParticipantSubmission({
      quizId: "quiz-smoke-demo",
      participantId: "participant-smoke-demo",
      answerId: "answer-smoke-a",
    }),
});

export const firebaseHttpFunctions = [
  health,
  bootstrapSmokeFlow,
  handleQuizChange,
  handleParticipantSubmission,
] as const;

export function describeHttpFunction(definition: HttpFunctionDefinition) {
  const [route, ...compatibilityRoutes] = definition.routes;

  return {
    compatibilityRoutes,
    functionName: definition.functionName,
    method: definition.method,
    route,
  };
}

export function matchHttpFunction(
  method: string | undefined,
  url: string | undefined,
): HttpFunctionDefinition | undefined {
  const pathname = normalizePathname(url);
  if (pathname === undefined) {
    return undefined;
  }

  return firebaseHttpFunctions.find(
    (definition) =>
      definition.method === method && definition.routes.includes(pathname),
  );
}

function defineHttpFunction(definition: HttpFunctionDefinition): HttpFunctionDefinition {
  return definition;
}

function normalizePathname(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }

  return new URL(url, "http://localhost").pathname;
}
