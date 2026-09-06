import { getTranslations } from "next-intl/server";
import {
  resolvePublicProfile,
  type UserProfileRecord,
} from "@/lib/profile-privacy";

type SellerCardProps = {
  user: UserProfileRecord;
  viewerId?: string | null;
  locale: string;
  compact?: boolean;
};

export async function SellerCard({ user, viewerId, locale, compact }: SellerCardProps) {
  const t = await getTranslations();
  const profile = resolvePublicProfile(
    user,
    viewerId,
    locale,
    t("profile.anonymousUser")
  );

  const locationParts = [profile.villageLabel, profile.marzLabel].filter(Boolean);
  const locationLine = locationParts.length > 0 ? locationParts.join(", ") : null;

  if (compact) {
    return (
      <p className="detail-seller-inline muted">
        {t("detail.postedBy")}{" "}
        <strong>{profile.displayName}</strong>
        {locationLine ? <> · {locationLine}</> : null}
      </p>
    );
  }

  return (
    <div className="detail-seller-card">
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatarUrl}
          alt=""
          className="detail-seller-avatar detail-seller-avatar-img"
        />
      ) : (
        <span className="detail-seller-avatar" aria-hidden>
          {profile.isAnonymous ? "?" : (profile.displayName || "?").slice(0, 1).toUpperCase()}
        </span>
      )}
      <div>
        <strong>{profile.displayName}</strong>
        <span className="muted">{t("detail.postedBy")}</span>
        {locationLine ? <span className="detail-seller-location">{locationLine}</span> : null}
        {profile.phone ? (
          <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="detail-seller-phone">
            {profile.phone}
          </a>
        ) : null}
      </div>
    </div>
  );
}
