import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
  request: Request;
  responseCookies: string[];
}

const requestStorage = new AsyncLocalStorage<RequestContext>();

export function withRequestContext<T>(
  request: Request,
  callback: (context: RequestContext) => Promise<T>,
): Promise<T> {
  const context = { request, responseCookies: [] };
  return requestStorage.run(context, () => callback(context));
}

export function getRequestContext(): RequestContext {
  const context = requestStorage.getStore();
  if (!context) throw new Error("Request context is not available.");
  return context;
}
