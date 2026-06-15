import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Local dev runs on Node < 22, which has no global WebSocket. supabase-js's
// realtime client throws on construction without one. Cloudflare (production)
// has native WebSocket, so this branch never runs there (and the bundler is
// told to ignore the import so `ws` is not pulled into the Worker build).
if (typeof (globalThis as any).WebSocket === "undefined") {
  try {
    const wsSpecifier = "ws";
    const ws: any = await import(/* @vite-ignore */ wsSpecifier);
    (globalThis as any).WebSocket = ws.WebSocket ?? ws.default;
  } catch {
    // ws not available — supabase realtime will warn but REST/auth still work.
  }
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
