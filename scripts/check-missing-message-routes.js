/**
 * Hit major hy routes and report MISSING_MESSAGE / Issue overlay signals.
 */
const http = require("http");

const routes = [
  "/hy",
  "/hy/pricing",
  "/hy/animals",
  "/hy/machinery",
  "/hy/farm",
  "/hy/today",
  "/hy/diary",
  "/hy/features/solve",
  "/hy/security",
  "/hy/account/profile",
  "/hy/spaces",
  "/hy/sell-decision",
  "/hy/costs",
  "/hy/group-buy/about",
];

function fetch(path) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: "127.0.0.1", port: 3000, path, timeout: 60000 },
      (res) => {
        let body = "";
        res.on("data", (c) => {
          body += c;
          if (body.length > 2_000_000) res.destroy();
        });
        res.on("end", () =>
          resolve({ status: res.statusCode, body, redirected: false })
        );
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: String(e), error: true }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, body: "timeout", error: true });
    });
  });
}

(async () => {
  for (const path of routes) {
    const r = await fetch(path);
    const missing = (r.body.match(/MISSING_MESSAGE/g) || []).length;
    const missingSamples = [
      ...new Set(
        [...r.body.matchAll(/MISSING_MESSAGE:[^<"\n]{0,120}/g)].map((m) =>
          m[0].slice(0, 100)
        )
      ),
    ].slice(0, 5);
    const issueOverlay =
      /Could not resolve|next-intl|__next_error__/i.test(r.body) && missing > 0;
    console.log(
      JSON.stringify({
        path,
        status: r.status,
        missing,
        samples: missingSamples,
        error: !!r.error,
      })
    );
  }
})();
