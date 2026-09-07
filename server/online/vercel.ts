import type { IncomingMessage, ServerResponse } from "node:http";
import { onlineApi } from "./api";
// The production rules and API deploy together from GitHub. This key is server-only.
export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  const SUPABASE_URL = process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "Cloud service not configured." }));
    return;
  }
  try {
    const origin = `https://${req.headers.host}`;
    const request = new Request(new URL(req.url ?? "/api/health", origin), {
      method: req.method,
      headers: {
        Authorization: req.headers.authorization ?? "",
        "Content-Type": "application/json",
      },
      body:
        req.method === "POST"
          ? typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body ?? {})
          : undefined,
    });
    const response = await onlineApi(request, {
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    });
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  } catch {
    res.statusCode = 502;
    res.end(
      JSON.stringify({ error: "Cloud service temporarily unavailable." }),
    );
  }
}
