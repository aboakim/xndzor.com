import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PaymentBadges } from "@/components/PaymentBadges";
import { BackToTop } from "@/components/BackToTop";
import { isDemoModeAllowed } from "@/lib/pricing";

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external || href.startsWith("http")) {
    return (
      <a href={href} className="site-footer-link" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="site-footer-link">
      {children}
    </Link>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="site-footer-col">
      <h3 className="site-footer-col-title">{title}</h3>
      <ul className="site-footer-links">{children}</ul>
    </div>
  );
}

function FooterIcon({ children }: { children: React.ReactNode }) {
  return <span className="site-footer-link-icon" aria-hidden>{children}</span>;
}

export async function Footer() {
  const t = await getTranslations("footer");
  const tPayments = await getTranslations("payments");
  const brand = await getTranslations();
  const demoMode = isDemoModeAllowed();

  return (
    <>
      <footer className="site-footer site-footer-vendo">
        <div className="site-footer-inner">
          <div className="site-footer-grid">
            <div className="site-footer-col site-footer-brand">
              <Link href="/" className="site-footer-logo">
                {brand("brand")}
              </Link>
              <p className="site-footer-tagline">{t("tagline")}</p>
              <p className="site-footer-sub">{brand("brandLatin")}</p>
            </div>

            <FooterColumn title={t("usefulLinks")}>
              <li>
                <FooterLink href="/about">
                  <FooterIcon>ℹ</FooterIcon>
                  {t("about")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/help">
                  <FooterIcon>?</FooterIcon>
                  {t("help")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/contact">
                  <FooterIcon>✉</FooterIcon>
                  {t("contact")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/pricing">
                  <FooterIcon>◆</FooterIcon>
                  {t("pricing")}
                </FooterLink>
              </li>
            </FooterColumn>

            <FooterColumn title={t("services")}>
              <li>
                <FooterLink href="/plots">
                  <FooterIcon>🌾</FooterIcon>
                  {t("farmPassport")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/grow">
                  <FooterIcon>📈</FooterIcon>
                  {t("growExchange")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/pricing">
                  <FooterIcon>▲</FooterIcon>
                  {t("topPlacement")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/group-buy">
                  <FooterIcon>👥</FooterIcon>
                  {t("groupBuy")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/jobs">
                  <FooterIcon>🔧</FooterIcon>
                  {t("jobs")}
                </FooterLink>
              </li>
            </FooterColumn>
          </div>

          <PaymentBadges
            label={t("paymentMethods")}
            comingSoonLabel={t("comingSoon")}
            demoMode={demoMode}
            linkToPricing={demoMode}
            demoBadgeLabel={tPayments("demoBadge")}
          />

          <div className="site-footer-legal-row">
            <div className="site-footer-legal-links">
              <FooterLink href="/security">{t("security")}</FooterLink>
              <FooterLink href="/terms">{t("terms")}</FooterLink>
              <FooterLink href="/privacy">{t("privacy")}</FooterLink>
              <span className="site-footer-cookies">{t("cookiesNote")}</span>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <div className="site-footer-bottom-inner">
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
            <div className="site-footer-bottom-links">
              <FooterLink href="/privacy">{t("privacy")}</FooterLink>
              <FooterLink href="/terms">{t("terms")}</FooterLink>
              <span className="site-footer-cookies-inline">{t("cookies")}</span>
            </div>
          </div>
        </div>
      </footer>
      <BackToTop />
    </>
  );
}
