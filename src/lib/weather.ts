import { MARZ_COORDS } from "./marz-coords";
import { prisma } from "./prisma";

export type WeatherSource = "openweather" | "open-meteo" | "yandex" | "demo" | "placeholder";

/** Legacy brief used by homepage / plots. */
export type WeatherBrief = {
  ok: boolean;
  source: WeatherSource;
  summary: string;
  tempC?: number;
  tempMaxC?: number;
  tempMinC?: number;
  precipMm?: number;
  windMs?: number;
  humidity?: number;
  description?: string;
  caveat: string;
  isDemo: boolean;
};

export type WeatherRisk = {
  id: "wind" | "frost" | "irrigation" | "harvest";
  level: "low" | "medium" | "high";
  title: string;
  detail: string;
};

export type FarmWeatherBundle = WeatherBrief & {
  risks: WeatherRisk[];
  placeLabel?: string;
};

/** Rich forecast for Farm OS (/today, /api/weather, village radar). */
export type WeatherForecast = {
  ok: boolean;
  source: WeatherSource;
  currentTempC: number | null;
  tempMaxC: number | null;
  tempMinC: number | null;
  windMaxMs: number | null;
  precipMmToday: number | null;
  precipMm48h: number | null;
  frostRisk48h: boolean;
  frostMinTempC: number | null;
  irrigationHint: "postpone" | "water_soon" | "normal";
  harvestWindow: "good" | "fair" | "poor";
  summary: string;
  caveat: string;
  placeLabel?: string;
  isDemo: boolean;
};

type Locale = string;

function caveatFor(locale: Locale, isDemo: boolean): string {
  if (isDemo) {
    return locale === "hy"
      ? "Դեմո կանխատեսում — ավելացրեք OPENWEATHER_API_KEY .env-ում իրական եղանակի համար։"
      : locale === "ru"
        ? "Демо-прогноз — добавьте OPENWEATHER_API_KEY в .env для живой погоды."
        : "Demo forecast — set OPENWEATHER_API_KEY in .env for live weather.";
  }
  return locale === "hy"
    ? "Եղանակը մոտավոր է — ստուգեք տեղում նախքան ոռոգումը կամ բերքահավաքը։"
    : locale === "ru"
      ? "Погода приблизительная — проверьте на месте перед поливом или уборкой."
      : "Weather is approximate — verify locally before irrigating or harvesting.";
}

function summaryText(
  locale: Locale,
  tempMax: number | null | undefined,
  precip: number,
  windMs: number,
  rainy: boolean
): string {
  if (locale === "hy") {
    return rainy
      ? `Այսօր ~${tempMax ?? "—"}°C, տեղումներ (~${precip} մմ), քամի ~${windMs.toFixed(1)} մ/վ։`
      : `Այսօր առավ. ~${tempMax ?? "—"}°C, տեղումներ քիչ (~${precip} մմ)։`;
  }
  if (locale === "ru") {
    return rainy
      ? `Сегодня ~${tempMax ?? "—"}°C, осадки (~${precip} мм), ветер ~${windMs.toFixed(1)} м/с.`
      : `Сегодня макс. ~${tempMax ?? "—"}°C, осадков мало (~${precip} мм).`;
  }
  return rainy
    ? `Today ~${tempMax ?? "—"}°C, rain (~${precip} mm), wind ~${windMs.toFixed(1)} m/s.`
    : `Today max ~${tempMax ?? "—"}°C, little rain (~${precip} mm).`;
}

function deriveHints(input: {
  precipToday: number;
  precip48: number;
  tempMin48: number | null;
  windMax: number;
  tempMax: number | null;
}): Pick<WeatherForecast, "frostRisk48h" | "irrigationHint" | "harvestWindow"> {
  const frostRisk48h = input.tempMin48 != null && input.tempMin48 <= 2;
  let irrigationHint: WeatherForecast["irrigationHint"] = "normal";
  if (input.precipToday >= 5 || input.precip48 >= 12) irrigationHint = "postpone";
  else if (input.precipToday < 1 && (input.tempMax ?? 20) >= 26) irrigationHint = "water_soon";

  let harvestWindow: WeatherForecast["harvestWindow"] = "fair";
  if (input.precipToday < 2 && input.windMax < 8 && !frostRisk48h) harvestWindow = "good";
  else if (input.precipToday >= 8 || input.windMax >= 12 || frostRisk48h) harvestWindow = "poor";

  return { frostRisk48h, irrigationHint, harvestWindow };
}

function toForecast(
  locale: Locale,
  source: WeatherSource,
  data: {
    currentTempC: number | null;
    tempMaxC: number | null;
    tempMinC: number | null;
    windMaxMs: number | null;
    precipMmToday: number | null;
    precipMm48h: number | null;
    frostMinTempC: number | null;
  },
  placeLabel?: string,
  isDemo = false
): WeatherForecast {
  const precipToday = data.precipMmToday ?? 0;
  const precip48 = data.precipMm48h ?? precipToday;
  const windMax = data.windMaxMs ?? 0;
  const hints = deriveHints({
    precipToday,
    precip48,
    tempMin48: data.frostMinTempC ?? data.tempMinC,
    windMax,
    tempMax: data.tempMaxC,
  });
  return {
    ok: true,
    source,
    ...data,
    ...hints,
    summary: summaryText(
      locale,
      data.tempMaxC,
      precipToday,
      windMax,
      precipToday >= 3
    ),
    caveat: caveatFor(locale, isDemo),
    placeLabel,
    isDemo,
  };
}

function demoForecastFull(locale: Locale, lat: number, placeLabel?: string): WeatherForecast {
  const base = lat >= 40.7 ? 14 : 19;
  return toForecast(
    locale,
    "demo",
    {
      currentTempC: base,
      tempMaxC: base + 3,
      tempMinC: base - 4,
      windMaxMs: 4.5,
      precipMmToday: 1.2,
      precipMm48h: 3.5,
      frostMinTempC: base - 4,
    },
    placeLabel,
    true
  );
}

async function fetchOpenWeatherRaw(
  lat: number,
  lon: number,
  locale: Locale,
  apiKey: string,
  placeLabel?: string
): Promise<WeatherForecast | null> {
  try {
    const lang = locale === "hy" ? "hy" : locale === "ru" ? "ru" : "en";
    const curUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
    curUrl.searchParams.set("lat", String(lat));
    curUrl.searchParams.set("lon", String(lon));
    curUrl.searchParams.set("appid", apiKey);
    curUrl.searchParams.set("units", "metric");
    curUrl.searchParams.set("lang", lang);

    const fcUrl = new URL("https://api.openweathermap.org/data/2.5/forecast");
    fcUrl.searchParams.set("lat", String(lat));
    fcUrl.searchParams.set("lon", String(lon));
    fcUrl.searchParams.set("appid", apiKey);
    fcUrl.searchParams.set("units", "metric");

    const [curRes, fcRes] = await Promise.all([
      fetch(curUrl.toString(), { next: { revalidate: 1800 } }),
      fetch(fcUrl.toString(), { next: { revalidate: 1800 } }),
    ]);
    if (!curRes.ok) return null;
    const cur = (await curRes.json()) as {
      main?: { temp?: number; temp_min?: number; temp_max?: number };
      wind?: { speed?: number };
      rain?: { "1h"?: number; "3h"?: number };
      weather?: { description?: string }[];
    };

    let precip48 = cur.rain?.["1h"] ?? cur.rain?.["3h"] ?? 0;
    let tempMin48 = cur.main?.temp_min ?? cur.main?.temp ?? null;
    let windMax = cur.wind?.speed ?? 0;
    if (fcRes.ok) {
      const fc = (await fcRes.json()) as {
        list?: {
          main?: { temp_min?: number };
          wind?: { speed?: number };
          rain?: { "3h"?: number };
        }[];
      };
      const slice = (fc.list || []).slice(0, 16);
      for (const item of slice) {
        precip48 += item.rain?.["3h"] ?? 0;
        windMax = Math.max(windMax, item.wind?.speed ?? 0);
        if (item.main?.temp_min != null) {
          tempMin48 =
            tempMin48 == null
              ? item.main.temp_min
              : Math.min(tempMin48, item.main.temp_min);
        }
      }
    }

    const precipToday = cur.rain?.["1h"] ?? cur.rain?.["3h"] ?? 0;
    const desc = cur.weather?.[0]?.description ?? "";
    const forecast = toForecast(
      locale,
      "openweather",
      {
        currentTempC: cur.main?.temp ?? null,
        tempMaxC: cur.main?.temp_max ?? cur.main?.temp ?? null,
        tempMinC: cur.main?.temp_min ?? cur.main?.temp ?? null,
        windMaxMs: windMax,
        precipMmToday: precipToday,
        precipMm48h: Math.round(precip48 * 10) / 10,
        frostMinTempC: tempMin48,
      },
      placeLabel,
      false
    );
    if (desc) {
      forecast.summary =
        locale === "hy"
          ? `Հիմա ~${Math.round(cur.main?.temp ?? 0)}°C, ${desc}. ${forecast.summary}`
          : locale === "ru"
            ? `Сейчас ~${Math.round(cur.main?.temp ?? 0)}°C, ${desc}. ${forecast.summary}`
            : `Now ~${Math.round(cur.main?.temp ?? 0)}°C, ${desc}. ${forecast.summary}`;
    }
    return forecast;
  } catch {
    return null;
  }
}

async function fetchOpenMeteoRaw(
  lat: number,
  lon: number,
  locale: Locale,
  placeLabel?: string
): Promise<WeatherForecast | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max"
    );
    url.searchParams.set("current_weather", "true");
    url.searchParams.set("forecast_days", "2");
    url.searchParams.set("timezone", "Asia/Yerevan");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current_weather?: { temperature?: number; windspeed?: number };
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_sum?: number[];
        windspeed_10m_max?: number[];
      };
    };
    const precipToday = data.daily?.precipitation_sum?.[0] ?? 0;
    const precip48 =
      precipToday + (data.daily?.precipitation_sum?.[1] ?? 0);
    const windKmh = data.daily?.windspeed_10m_max?.[0] ?? data.current_weather?.windspeed ?? 0;
    const windMaxMs = windKmh / 3.6;
    const tempMin0 = data.daily?.temperature_2m_min?.[0] ?? null;
    const tempMin1 = data.daily?.temperature_2m_min?.[1] ?? null;
    const frostMin =
      tempMin0 != null && tempMin1 != null
        ? Math.min(tempMin0, tempMin1)
        : tempMin0;

    return toForecast(
      locale,
      "open-meteo",
      {
        currentTempC: data.current_weather?.temperature ?? null,
        tempMaxC: data.daily?.temperature_2m_max?.[0] ?? null,
        tempMinC: tempMin0,
        windMaxMs,
        precipMmToday: precipToday,
        precipMm48h: precip48,
        frostMinTempC: frostMin,
      },
      placeLabel,
      false
    );
  } catch {
    return null;
  }
}

/**
 * Resolve coords from explicit lat/lng, village id, or marz centroid.
 */
export type WeatherCoords = {
  lat: number;
  lng: number;
  /** Alias of lng for callers that still use OpenWeather-style `lon`. */
  lon: number;
  placeLabel?: string;
};

function asCoords(
  lat: number,
  lng: number,
  placeLabel?: string
): WeatherCoords {
  return { lat, lng, lon: lng, placeLabel };
}

export async function resolveWeatherCoords(input: {
  lat?: number | null;
  lng?: number | null;
  villageId?: string | null;
  marzId?: string | null;
  villageLat?: number | null;
  villageLng?: number | null;
  placeLabel?: string;
}): Promise<WeatherCoords | null> {
  if (
    input.lat != null &&
    input.lng != null &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng)
  ) {
    return asCoords(input.lat, input.lng, input.placeLabel);
  }
  if (
    input.villageLat != null &&
    input.villageLng != null &&
    Number.isFinite(input.villageLat) &&
    Number.isFinite(input.villageLng)
  ) {
    return asCoords(input.villageLat, input.villageLng, input.placeLabel);
  }
  if (input.villageId) {
    const v = await prisma.village.findUnique({
      where: { id: input.villageId },
      include: { marz: true },
    });
    if (v?.lat != null && v?.lng != null) {
      return asCoords(v.lat, v.lng, input.placeLabel || v.nameEn);
    }
    if (v?.marzId && MARZ_COORDS[v.marzId]) {
      const c = MARZ_COORDS[v.marzId];
      return asCoords(c.lat, c.lon, input.placeLabel || v.nameEn);
    }
  }
  if (input.marzId && MARZ_COORDS[input.marzId]) {
    const c = MARZ_COORDS[input.marzId];
    return asCoords(c.lat, c.lon, input.placeLabel || input.marzId);
  }
  return null;
}

/** Alias kept for Farm OS pages that imported the older name. */
export const resolveWeatherCoordsAsync = resolveWeatherCoords;

/** Sync helper for /farm pages that already have village lat/lng. */
export function resolveWeatherCoordsSync(input: {
  marzId?: string | null;
  villageLat?: number | null;
  villageLng?: number | null;
  placeLabel?: string;
}): { lat: number; lon: number; placeLabel?: string } | null {
  if (
    input.villageLat != null &&
    input.villageLng != null &&
    Number.isFinite(input.villageLat) &&
    Number.isFinite(input.villageLng)
  ) {
    return {
      lat: input.villageLat,
      lon: input.villageLng,
      placeLabel: input.placeLabel,
    };
  }
  if (input.marzId && MARZ_COORDS[input.marzId]) {
    const c = MARZ_COORDS[input.marzId];
    return { lat: c.lat, lon: c.lon, placeLabel: input.placeLabel ?? input.marzId };
  }
  return null;
}

export async function fetchWeatherForecast(input: {
  lat: number;
  lng: number;
  locale?: string;
  placeLabel?: string;
}): Promise<WeatherForecast> {
  const locale = input.locale || "en";
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  if (key) {
    const ow = await fetchOpenWeatherRaw(
      input.lat,
      input.lng,
      locale,
      key,
      input.placeLabel
    );
    if (ow) return ow;
  }
  const om = await fetchOpenMeteoRaw(input.lat, input.lng, locale, input.placeLabel);
  if (om) return om;
  return demoForecastFull(locale, input.lat, input.placeLabel);
}

function forecastToBrief(f: WeatherForecast): WeatherBrief {
  return {
    ok: f.ok,
    source: f.source === "demo" ? "demo" : f.source,
    summary: f.summary,
    tempC: f.currentTempC ?? undefined,
    tempMaxC: f.tempMaxC ?? undefined,
    tempMinC: f.tempMinC ?? undefined,
    precipMm: f.precipMmToday ?? undefined,
    windMs: f.windMaxMs ?? undefined,
    caveat: f.caveat,
    isDemo: f.isDemo,
  };
}

function buildRisks(
  w: WeatherBrief,
  locale: Locale,
  plotHints?: {
    lastIrrigationAt?: Date | null;
    harvestFrom?: Date | null;
    harvestTo?: Date | null;
  }
): WeatherRisk[] {
  const windMs = w.windMs ?? 0;
  const tempMin = w.tempMinC ?? w.tempC ?? 10;
  const precip = w.precipMm ?? 0;
  const now = new Date();

  const windLevel: WeatherRisk["level"] =
    windMs >= 12 ? "high" : windMs >= 7 ? "medium" : "low";
  const frostLevel: WeatherRisk["level"] =
    tempMin <= 0 ? "high" : tempMin <= 3 ? "medium" : "low";
  const irrigLevel: WeatherRisk["level"] =
    precip >= 5 ? "low" : precip >= 2 ? "medium" : "high";

  let harvestLevel: WeatherRisk["level"] = "low";
  if (plotHints?.harvestFrom && plotHints?.harvestTo) {
    const inWindow = now >= plotHints.harvestFrom && now <= plotHints.harvestTo;
    if (inWindow && precip < 3 && windMs < 10) harvestLevel = "low";
    else if (inWindow && (precip >= 5 || windMs >= 10)) harvestLevel = "high";
    else if (inWindow) harvestLevel = "medium";
  } else if (precip < 2 && windMs < 8 && (w.tempMaxC ?? 20) >= 15) {
    harvestLevel = "medium";
  }

  const t = (hy: string, ru: string, en: string) =>
    locale === "hy" ? hy : locale === "ru" ? ru : en;

  const irrigationDetail = (() => {
    if (plotHints?.lastIrrigationAt) {
      const days = Math.floor(
        (now.getTime() - plotHints.lastIrrigationAt.getTime()) / 86400000
      );
      return t(
        `Վերջին ոռոգումը՝ ${days} օր առաջ։ Տեղումներ ~${precip} մմ։`,
        `Последний полив ${days} дн. назад. Осадки ~${precip} мм.`,
        `Last irrigation ${days} days ago. Precip ~${precip} mm.`
      );
    }
    return t(
      precip >= 3
        ? "Տեղումները կարող են բավարար լինել — ստուգեք հողը։"
        : "Չոր օր է սպասվում — հավանաբար պետք է ոռոգել։",
      precip >= 3
        ? "Осадков может хватить — проверьте почву."
        : "Ожидается сухой день — вероятно нужен полив.",
      precip >= 3
        ? "Rain may be enough — check soil."
        : "Dry day ahead — irrigation likely needed."
    );
  })();

  return [
    {
      id: "wind",
      level: windLevel,
      title: t("Քամի", "Ветер", "Wind"),
      detail: t(
        `~${windMs.toFixed(1)} մ/վ — ${windLevel === "high" ? "սրսկումը/թաղանթը ռիսկային է" : windLevel === "medium" ? "զգույշ սրսկում" : "հանգիստ"}։`,
        `~${windMs.toFixed(1)} м/с — ${windLevel === "high" ? "опрыскивание/плёнка рискованны" : windLevel === "medium" ? "осторожное опрыскивание" : "спокойно"}.`,
        `~${windMs.toFixed(1)} m/s — ${windLevel === "high" ? "spray/cover risky" : windLevel === "medium" ? "spray with care" : "calm"}.`
      ),
    },
    {
      id: "frost",
      level: frostLevel,
      title: t("Ցրտահարություն", "Заморозки", "Frost"),
      detail: t(
        `Գիշերային մին. ~${tempMin}°C — ${frostLevel === "high" ? "պաշտպանեք զգայուն մշակաբույսերը" : frostLevel === "medium" ? "հետևեք ցածրադիր տեղերին" : "ռիսկը ցածր է"}։`,
        `Ночн. мин. ~${tempMin}°C — ${frostLevel === "high" ? "защитите чувствительные культуры" : frostLevel === "medium" ? "следите за низинами" : "риск низкий"}.`,
        `Night min ~${tempMin}°C — ${frostLevel === "high" ? "protect sensitive crops" : frostLevel === "medium" ? "watch low spots" : "low risk"}.`
      ),
    },
    {
      id: "irrigation",
      level: irrigLevel,
      title: t("Ոռոգման կարիք", "Нужен полив", "Irrigation need"),
      detail: irrigationDetail,
    },
    {
      id: "harvest",
      level: harvestLevel,
      title: t("Բերքահավաքի պատուհան", "Окно уборки", "Harvest window"),
      detail: t(
        harvestLevel === "high"
          ? "Չոր և հանգիստ չէ — հետաձգեք եթե կարող եք։"
          : harvestLevel === "medium"
            ? "Պատուհանը մասամբ բաց է — պլանավորեք առավոտը։"
            : "Պայմանները հարմար են բերքահավաքի համար։",
        harvestLevel === "high"
          ? "Не сухо и не спокойно — отложите, если можете."
          : harvestLevel === "medium"
            ? "Окно частично открыто — планируйте утро."
            : "Условия благоприятны для уборки.",
        harvestLevel === "high"
          ? "Not dry/calm — delay if you can."
          : harvestLevel === "medium"
            ? "Partial window — plan the morning."
            : "Conditions look good for harvest."
      ),
    },
  ];
}

export async function fetchLiveWeather(
  coords: { lat: number; lon: number; placeLabel?: string },
  locale = "en"
): Promise<WeatherBrief> {
  const f = await fetchWeatherForecast({
    lat: coords.lat,
    lng: coords.lon,
    locale,
    placeLabel: coords.placeLabel,
  });
  return forecastToBrief(f);
}

export async function fetchFarmWeather(
  input: {
    marzId?: string | null;
    villageLat?: number | null;
    villageLng?: number | null;
    placeLabel?: string;
    lastIrrigationAt?: Date | null;
    harvestFrom?: Date | null;
    harvestTo?: Date | null;
  },
  locale = "en"
): Promise<FarmWeatherBundle> {
  const coords = resolveWeatherCoordsSync(input);
  if (!coords) {
    const brief = forecastToBrief(demoForecastFull(locale, 40.18));
    return {
      ...brief,
      ok: false,
      summary:
        locale === "hy"
          ? "Եղանակային տվյալներ հասանելի չեն այս տեղանքի համար։"
          : locale === "ru"
            ? "Нет погодных данных для этой локации."
            : "No weather data for this location yet.",
      risks: buildRisks(brief, locale, input),
    };
  }
  const brief = await fetchLiveWeather(coords, locale);
  return {
    ...brief,
    placeLabel: coords.placeLabel,
    risks: buildRisks(brief, locale, input),
  };
}

export async function fetchMarzWeather(
  marzId: string,
  locale = "en"
): Promise<WeatherBrief> {
  const coords = resolveWeatherCoordsSync({ marzId });
  if (!coords) {
    return {
      ok: false,
      source: "placeholder",
      summary:
        locale === "hy"
          ? "Եղանակային տվյալներ հասանելի չեն այս մարզի համար։"
          : locale === "ru"
            ? "Нет погодных данных для этого марза."
            : "No weather data for this marz yet.",
      caveat: caveatFor(locale, true),
      isDemo: true,
    };
  }
  return fetchLiveWeather(coords, locale);
}
