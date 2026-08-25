// Signs in as a demo account and checks that the logged-in home renders the
// "today" block and the plot strip.
//
// Run: node scripts/smoke-logged-in.mjs [email] [baseUrl]
const email = process.argv[2] || "farmer@demo.am";
const base = process.argv[3] || "http://localhost:3000";
const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(path, init = {}) {
  const res = await fetch(base + path, {
    ...init,
    redirect: "manual",
    headers: { ...(init.headers || {}), cookie: cookieHeader() },
  });
  for (const c of res.headers.getSetCookie?.() || []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return res;
}

const csrfRes = await req("/api/auth/csrf");
const { csrfToken } = await csrfRes.json();

const login = await req("/api/auth/callback/credentials", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    csrfToken,
    email,
    password: "password123",
    callbackUrl: `${base}/hy`,
    json: "true",
  }).toString(),
});
console.log("login status:", login.status);

const session = await (await req("/api/auth/session")).json();
console.log("session user:", session?.user?.email, session?.user?.role ?? "");

const home = await req("/hy");
const html = await home.text();
const has = (needle) => html.includes(needle);
console.log("home status:", home.status, "bytes:", html.length);
console.log({
  todayBlock: has("home-farm-strip") || has("today"),
  plotStrip: has("plot-strip"),
  plotChips: (html.match(/plot-chip/g) || []).length,
  villageLinks: (html.match(/village-link/g) || []).length,
  postCards: (html.match(/class="post-card"/g) || []).length,
});
