"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Genera un código QR (como data URL PNG) para la `value` indicada, del lado
 * del cliente. Se usa para el enlace del test vocacional de cada grupo.
 */
export default function QrCode({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0b0f14", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setError("No se pudo generar el código QR.");
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (error) {
    return <span className="muted">{error}</span>;
  }
  if (!dataUrl) {
    return <span className="muted">Generando QR…</span>;
  }
  return (
    <span className="qr-box">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`Código QR para ${value}`}
        width={size}
        height={size}
        data-testid="qr-image"
      />
    </span>
  );
}
