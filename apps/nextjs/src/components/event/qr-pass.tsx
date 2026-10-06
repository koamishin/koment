import QRCode from "qrcode";

interface QrPassProps {
  code: string;
  size?: number;
  className?: string;
}

export async function QrPass({ code, size = 192, className }: QrPassProps) {
  const svg = await QRCode.toString(code, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000ff", light: "#ffffffff" },
  });

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      // QR modules are generated from an opaque random code, never user input.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
