/**
 * Static verification: required absolute keys exist in hy/en/ru.
 */
const fs = require("fs");
const path = require("path");

function get(o, p) {
  return p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
}

function flatten(obj, prefix = "", out = []) {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
    out.push(prefix);
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

const required = {
  "home.recentKind.machinery": 1,
  "home.recentKind.animals": 1,
  "home.recentKind.supply": 1,
  "home.recentKind.forward": 1,
  "home.recentKind.demand": 1,
  "home.recentKind.jobs": 1,
  "home.recentlyViewed": 1,
  "profile.title": 1,
  "profile.lede": 1,
  "profile.sections.photo": 1,
  "profile.photo.change": 1,
  "share.title": 1,
  "share.copy": 1,
  "my.markActive": 1,
  "reportListing.button": 1,
  "resourceInterest.send": 1,
  "admin.title": 1,
  "admin.stats.users": 1,
  "xndzor.pastelCards.sectionTitle": 1,
  "groupBuy.about.title": 1,
  "groupBuy.about.steps": 1,
  "farmOs.today.title": 1,
  "farmOs.brandEyebrow": 1,
  "farmOs.danger.title": 1,
  "farmOs.risks.frost": 1,
  "farmOs.risks.calmDetail": 1,
  "farmOs.weather.irrigationHint.normal": 1,
  "farmOs.weather.harvestWindow.good": 1,
  "farmOs.costs.categories.diesel": 1,
  "farmOs.score.axes.production": 1,
  "farmOs.score.tips.logCosts": 1,
  "farmOs.sell.scenario.store30": 1,
  "farmOs.diary.placeholder": 1,
  "farmOs.spaces.types.WAREHOUSE": 1,
  "farmOs.return.title": 1,
  "farmOs.timeline.plant": 1,
  "farmOs.radar.heading": 1,
  "farmOs.villageTogether.nav": 1,
  "farmOs.yieldWhy.title": 1,
  "pages.security.title": 1,
  "features.about.solve.title": 1,
  "farm.hub.title": 1,
  "pricing.free": 1,
};

let ok = true;
for (const loc of ["hy", "en", "ru"]) {
  const m = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "messages", `${loc}.json`), "utf8")
  );
  const miss = Object.keys(required).filter((k) => {
    const v = get(m, k);
    return v === undefined || v === null || v === "";
  });
  console.log(loc, miss.length ? `MISSING ${miss.length}: ${miss.join(", ")}` : "OK");
  if (miss.length) ok = false;

  // farmOs leaf count
  const leaves = flatten(m.farmOs, "farmOs");
  console.log(" ", "farmOs leaves:", leaves.length);
}

process.exit(ok ? 0 : 1);
