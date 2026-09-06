const http = require("http");
const routes = process.argv.slice(2);
if (!routes.length) {
  console.error("usage: node scripts/check-routes-once.js /hy/pricing ...");
  process.exit(1);
}

function get(path) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: "127.0.0.1", port: 3000, path, timeout: 180000 },
      (res) => {
        let body = "";
        res.on("data", (c) => {
          body += c;
          if (body.length > 2_000_000) res.destroy();
        });
        res.on("end", () => {
          const missing = (body.match(/MISSING_MESSAGE/g) || []).length;
          const samples = [
            ...new Set(
              [...body.matchAll(/MISSING_MESSAGE:[^<"\n]{0,100}/g)].map((m) =>
                m[0]
              )
            ),
          ].slice(0, 5);
          resolve({ path, status: res.statusCode, missing, samples });
        });
      }
    );
    req.on("error", (e) =>
      resolve({ path, status: 0, missing: 0, error: String(e) })
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ path, status: 0, missing: 0, error: "timeout" });
    });
  });
}

(async () => {
  for (const path of routes) {
    console.log(JSON.stringify(await get(path)));
  }
})();
