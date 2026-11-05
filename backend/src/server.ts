import cors from "cors";
import express, {
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from "express";
import { connectDatabase } from "./db/index.js";
import { withRequestContext } from "./lib/requestContext.js";
import { getMongoErrorMessage } from "./lib/api.js";
import { GET as getAlerts } from "./api/alerts/route.js";
import { PATCH as updateAlert } from "./api/alerts/[id]/status/route.js";
import { GET as getStats } from "./api/dashboard/stats/route.js";
import { GET as health } from "./api/health/route.js";
import { GET as getLogins } from "./api/logins/route.js";
import { GET as getRiskAnalysis } from "./api/risk-analysis/route.js";
import { GET as getUsers } from "./api/users/route.js";
import { POST as login } from "./api/auth/login/route.js";
import { POST as logout } from "./api/auth/logout/route.js";
import { GET as me } from "./api/auth/me/route.js";
import { POST as register } from "./api/auth/register/route.js";

type RouteContext = { params: Promise<{ id: string }> };
type ApiHandler = (
  request: Request,
  context?: RouteContext,
) => Promise<Response>;
type ContextFactory = (request: ExpressRequest) => RouteContext | undefined;

const app = express();
const frontendOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));

function adapt(
  handler: ApiHandler,
  createContext?: ContextFactory,
): (request: ExpressRequest, response: ExpressResponse) => Promise<void> {
  return async (request, response) => {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (value !== undefined) {
        headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
    }
    headers.delete("content-length");
    headers.delete("transfer-encoding");

    const method = request.method.toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const webRequest = new Request(
      `${request.protocol}://${request.get("host")}${request.originalUrl}`,
      {
        method,
        headers,
        ...(hasBody && request.body !== undefined
          ? { body: JSON.stringify(request.body) }
          : {}),
      },
    );

    await withRequestContext(webRequest, async (context) => {
      const result = await handler(webRequest, createContext?.(request));
      result.headers.forEach((value, name) => response.setHeader(name, value));
      if (context.responseCookies.length > 0) {
        response.setHeader("Set-Cookie", context.responseCookies);
      }
      response.status(result.status).send(Buffer.from(await result.arrayBuffer()));
    });
  };
}

app.get("/api/health", adapt(health));
app.post("/api/auth/login", adapt(login));
app.post("/api/auth/register", adapt(register));
app.post("/api/auth/logout", adapt(logout));
app.get("/api/auth/me", adapt(me));
app.get("/api/dashboard/stats", adapt(getStats));
app.get("/api/alerts", adapt(getAlerts));
app.patch(
  "/api/alerts/:id/status",
  adapt(updateAlert, (request) => ({
    params: Promise.resolve({ id: String(request.params.id) }),
  })),
);
app.get("/api/logins", adapt(getLogins));
app.get("/api/risk-analysis", adapt(getRiskAnalysis));
app.get("/api/users", adapt(getUsers));

app.use((_request, response) => {
  response.status(404).json({ error: "Not found." });
});

app.use(
  (
    error: unknown,
    _request: ExpressRequest,
    response: ExpressResponse,
    _next: express.NextFunction,
  ) => {
    console.error("[backend-error]", error);
    response.status(500).json({ error: "Internal server error." });
  },
);

async function startServer() {
  try {
    await connectDatabase();
    console.log(`Connected to MongoDB database "${process.env.MONGODB_DB || "threadline"}".`);
  } catch (error) {
    const message = getMongoErrorMessage(error);
    console.error(
      message
        ? `MongoDB initialization failed: ${message}`
        : "MongoDB initialization failed. Check the backend error details.",
      message ? "" : error,
    );
  }

  const port = Number(process.env.BACKEND_PORT ?? 4000);
  app.listen(port, () => {
    console.log(`Threadline backend listening on http://localhost:${port}`);
  });
}

void startServer();
