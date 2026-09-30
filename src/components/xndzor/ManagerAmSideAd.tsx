"use client";

import { useEffect, useState } from "react";
import {
  HOME_SIDE_BANNER_HEIGHT,
  HOME_SIDE_BANNER_WIDTH,
} from "@/lib/side-banners";

/** Same endpoint as https://manager.am/banner.js (avoids shared globals + document.write). */
export const MANAGER_AM_BANNER_SCRIPT_URL = "https://manager.am/banner.js";

const WIDTH = HOME_SIDE_BANNER_WIDTH;
const HEIGHT = HOME_SIDE_BANNER_HEIGHT;

type Props = {
  slotId: number;
};

export function ManagerAmSideAd({ slotId }: Props) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  useEffect(() => {
    const domain = document.domain || window.location.hostname;
    const params = new URLSearchParams({
      as: String(slotId),
      url: domain,
      width: String(WIDTH),
      height: String(HEIGHT),
    });
    setIframeSrc(`https://manager.am/b.php?${params.toString()}`);
  }, [slotId]);

  return (
    <div
      className="home-trust-side-ad-mount"
      data-manager-ad-slot={slotId}
      data-manager-ad-width={WIDTH}
      data-manager-ad-height={HEIGHT}
    >
      {iframeSrc ? (
        <iframe
          title=""
          className="home-trust-side-ad-iframe"
          width={WIDTH}
          height={HEIGHT}
          frameBorder={0}
          scrolling="no"
          src={iframeSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : null}
    </div>
  );
}
