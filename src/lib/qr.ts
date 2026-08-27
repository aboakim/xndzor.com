import QRCode from "qrcode";

/** Server-side SVG QR for public passport / batch URLs. */
export async function qrSvgDataUrl(text: string, size = 180): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: { dark: "#121a1f", light: "#ffffff" },
  });
}
