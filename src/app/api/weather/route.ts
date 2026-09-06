import { NextResponse } from "next/server";
import {
  fetchWeatherForecast,
  resolveWeatherCoordsAsync,
} from "@/lib/weather";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const villageId = searchParams.get("villageId");
  const marzId = searchParams.get("marzId");
  const locale = searchParams.get("locale") || "en";

  const lat = latRaw != null ? Number(latRaw) : null;
  const lng = lngRaw != null ? Number(lngRaw) : null;

  const coords = await resolveWeatherCoordsAsync({
    lat,
    lng,
    villageId,
    marzId,
  });

  if (!coords) {
    return NextResponse.json(
      { error: "Provide lat&lng, villageId, or marzId" },
      { status: 400 }
    );
  }

  const forecast = await fetchWeatherForecast({
    lat: coords.lat,
    lng: coords.lng,
    locale,
    placeLabel: coords.placeLabel,
  });

  return NextResponse.json(forecast, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
