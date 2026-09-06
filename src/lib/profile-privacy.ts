import { localizedPlaceName, type PlaceName } from "@/lib/places";

export const PROFILE_VISIBILITY = ["PUBLIC", "REGISTERED", "HIDDEN"] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITY)[number];

export const USER_PROFILE_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  phone: true,
  profileVisibility: true,
  showPhonePublic: true,
  showAvatarPublic: true,
  showMarzPublic: true,
  showVillagePublic: true,
  marz: {
    select: { id: true, slug: true, nameHy: true, nameEn: true, nameRu: true },
  },
  village: {
    select: { id: true, slug: true, nameHy: true, nameEn: true, nameRu: true },
  },
} as const;

export type UserProfileRecord = {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  profileVisibility: string;
  showPhonePublic: boolean;
  showAvatarPublic: boolean;
  showMarzPublic: boolean;
  showVillagePublic: boolean;
  marz: PlaceName | null;
  village: PlaceName | null;
};

export type ResolvedPublicProfile = {
  isAnonymous: boolean;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  marzLabel: string | null;
  villageLabel: string | null;
};

function isProfileVisible(
  visibility: string,
  viewerId: string | null | undefined
): boolean {
  if (visibility === "HIDDEN") return false;
  if (visibility === "REGISTERED") return Boolean(viewerId);
  return true;
}

export function resolvePublicProfile(
  user: UserProfileRecord,
  viewerId: string | null | undefined,
  locale: string,
  anonymousLabel: string
): ResolvedPublicProfile {
  if (!isProfileVisible(user.profileVisibility, viewerId)) {
    return {
      isAnonymous: true,
      displayName: anonymousLabel,
      avatarUrl: null,
      phone: null,
      marzLabel: null,
      villageLabel: null,
    };
  }

  return {
    isAnonymous: false,
    displayName: user.name,
    avatarUrl: user.showAvatarPublic ? user.avatarUrl : null,
    phone: user.showPhonePublic ? user.phone : null,
    marzLabel:
      user.showMarzPublic && user.marz
        ? localizedPlaceName(user.marz, locale)
        : null,
    villageLabel:
      user.showVillagePublic && user.village
        ? localizedPlaceName(user.village, locale)
        : null,
  };
}
