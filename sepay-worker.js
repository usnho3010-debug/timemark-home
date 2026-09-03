function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function isAuthorized(request, apiKey) {
  if (!apiKey) return false;
  const authorization = String(request.headers.get("Authorization") || "").trim();
  const parts = authorization.split(/\s+/);
  return parts.length === 2 &&
    parts[0].toLowerCase() === "apikey" &&
    parts[1] === apiKey;
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return jsonResponse({ success: false, message: "Method not allowed" }, 405);
    }

    if (!isAuthorized(request, env.SEPAY_API_KEY)) {
      return jsonResponse({ success: false, message: "Unauthorized" }, 401);
    }

    if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET) {
      return jsonResponse({ success: false, message: "Worker is not configured" }, 500);
    }

    const rawBody = await request.text();
    try {
      JSON.parse(rawBody);
    } catch (error) {
      return jsonResponse({ success: false, message: "Invalid JSON" }, 400);
    }

    const target = new URL(env.APPS_SCRIPT_URL);
    target.searchParams.set("sepaySecret", env.APPS_SCRIPT_SECRET);

    const controller = new AbortController();
    const timeout = setTimeout(function () {
      controller.abort();
    }, 25000);

    try {
      const upstream = await fetch(target.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawBody,
        redirect: "follow",
        signal: controller.signal
      });

      const responseText = await upstream.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        return jsonResponse({ success: false, message: "Apps Script returned invalid JSON" }, 502);
      }

      if (!upstream.ok || result.success !== true) {
        return jsonResponse({
          success: false,
          message: "Apps Script rejected the webhook",
          upstreamStatus: result.status || "error"
        }, 502);
      }

      return jsonResponse(result, 200);
    } catch (error) {
      return jsonResponse({
        success: false,
        message: error && error.name === "AbortError" ? "Apps Script timeout" : "Upstream request failed"
      }, 502);
    } finally {
      clearTimeout(timeout);
    }
  }
};
