import { ContactActions } from "@/components/ContactActions";
import { userIsAdmin } from "@/lib/monetization";

/**
 * Server wrapper: hides Call / WhatsApp when the listing owner is platform admin
 * (role ADMIN or ADMIN_EMAIL), not when the viewer is admin.
 */
export async function OwnerContactActions({
  ownerId,
  phone,
  whatsapp,
  waText,
}: {
  ownerId: string;
  phone: string;
  whatsapp?: string | null;
  waText?: string;
}) {
  const hideContact = await userIsAdmin(ownerId);
  return (
    <ContactActions
      phone={phone}
      whatsapp={whatsapp}
      waText={waText}
      hideContact={hideContact}
    />
  );
}
