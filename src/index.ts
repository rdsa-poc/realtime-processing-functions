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
