/**
 * Homepage hero side ad slots (300×600), desktop (xl+) only.
 * Manager.am slots: left 1212, right 1213 (see ManagerAmSideAd).
 */
export const HOME_SIDE_BANNER_WIDTH = 300;
export const HOME_SIDE_BANNER_HEIGHT = 600;

export type HomeSideBannerConfig = {
  /** manager.am placement id; when set, renders live ad instead of image/placeholder */
  managerAdSlot?: number;
  imageUrl: string;
  href: string;
  /** Optional; falls back to the localized “Ad” label */
  alt?: string;
};

export const HOME_SIDE_BANNERS: {
  left: HomeSideBannerConfig;
  right: HomeSideBannerConfig;
} = {
  left: {
    managerAdSlot: 1212,
    imageUrl: "",
    href: "",
    alt: "",
  },
  right: {
    managerAdSlot: 1213,
    imageUrl: "",
    href: "",
    alt: "",
  },
};
