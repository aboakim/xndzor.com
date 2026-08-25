import { MARZ_COORDS } from "./marz-coords";

export type WeatherBrief = {
  ok: boolean;
  source: "open-meteo" | "placeholder";
  summary: string;
  tempMaxC?: number;
  precipMm?: number;
  caveat: string;
};

/**
 * Free Open-Meteo forecast for marz centroid. Falls back to honest placeholder.
 */
export async function fetchMarzWeather(
  marzId: string,
  locale = "en"
): Promise<WeatherBrief> {
  const coords = MARZ_COORDS[marzId];
  const caveat =
    locale === "hy"
      ? "Եղանակը մոտավոր է (մարզի կենտրոն) — ստուգեք տեղում նախքան ոռոգումը հետաձգելը։"
      : locale === "ru"
        ? "Погода приблизительная (центр марза) — проверьте на месте перед переносом полива."
        : "Weather is approximate (marz centroid) — verify locally before postponing irrigation.";

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
      caveat,
    };
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(coords.lat));
    url.searchParams.set("longitude", String(coords.lon));
    url.searchParams.set("daily", "temperature_2m_max,precipitation_sum");
    url.searchParams.set("forecast_days", "2");
    url.searchParams.set("timezone", "Asia/Yerevan");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("weather http");
    const data = (await res.json()) as {
      daily?: { temperature_2m_max?: number[]; precipitation_sum?: number[] };
    };
    const tempMax = data.daily?.temperature_2m_max?.[0];
    const precip = data.daily?.precipitation_sum?.[0];
    const rainy = (precip ?? 0) >= 3;

    let summary: string;
    if (locale === "hy") {
      summary = rainy
        ? `Այսօր ~${tempMax ?? "—"}°C, սպասվում է տեղումներ (~${precip} մմ) — կարող եք հետաձգել ոռոգումը։`
        : `Այսօր առավել. ~${tempMax ?? "—"}°C, տեղումներ քիչ (~${precip ?? 0} մմ)։`;
    } else if (locale === "ru") {
      summary = rainy
        ? `Сегодня ~${tempMax ?? "—"}°C, осадки (~${precip} мм) — полив можно отложить.`
        : `Сегодня макс. ~${tempMax ?? "—"}°C, осадков мало (~${precip ?? 0} мм).`;
    } else {
      summary = rainy
        ? `Today ~${tempMax ?? "—"}°C, rain expected (~${precip} mm) — you may postpone watering.`
        : `Today max ~${tempMax ?? "—"}°C, little rain (~${precip ?? 0} mm).`;
    }

    return {
      ok: true,
      source: "open-meteo",
      summary,
      tempMaxC: tempMax,
      precipMm: precip,
      caveat,
    };
  } catch {
    return {
      ok: false,
      source: "placeholder",
      summary:
        locale === "hy"
          ? "Եղանակի API ժամանակավորապես անհասանելի է — ոռոգումը մի հետաձգեք միայն եղանակի պատճառով։"
          : locale === "ru"
            ? "Погодный API временно недоступен — не откладывайте полив только из‑за прогноза."
            : "Weather API temporarily unavailable — do not postpone irrigation based on forecast alone.",
      caveat,
    };
  }
}
