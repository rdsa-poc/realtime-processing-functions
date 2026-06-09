export type ApplicationEventHandler = typeof onApplicationEvent;

export type ApplicationEventResult = {
  accepted: true;
  Event: unknown;
};

export type HttpFunctionDefinition = {
  functionName: "onApplicationEvent";
  method: "POST";
  route: "/onApplicationEvent";
  respond: (payload: unknown) => Promise<ApplicationEventResult>;
};

export async function onApplicationEvent(Event: unknown): Promise<ApplicationEventResult> {
  return {
    accepted: true,
    Event,
  };
}

export function createApplicationEventHandler(): HttpFunctionDefinition {
  return {
    functionName: "onApplicationEvent",
    method: "POST",
    route: "/onApplicationEvent",
    respond: async (payload) => onApplicationEvent(extractEvent(payload)),
  };
}

export function describeHttpFunction(definition: HttpFunctionDefinition) {
  return {
    functionName: definition.functionName,
    method: definition.method,
    route: definition.route,
  };
}

export function matchHttpFunction(
  method: string | undefined,
  url: string | undefined,
): HttpFunctionDefinition | undefined {
  const pathname = normalizePathname(url);
  if (method !== "POST" || pathname !== "/onApplicationEvent") {
    return undefined;
  }

  return createApplicationEventHandler();
}

function extractEvent(payload: unknown): unknown {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "Event" in payload
  ) {
    return (payload as { Event: unknown }).Event;
  }

  return payload;
}

function normalizePathname(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }

  return new URL(url, "http://localhost").pathname;
}
