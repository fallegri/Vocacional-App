"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Genera un código QR (como data URL PNG) para la `value` indicada, del lado
 * del cliente. Se usa para el enlace del test vocacional de cada grupo.
 * Ofrece acciones de descarga e impresión para que el personal pueda
 * compartir/imprimir el QR del grupo.
 */
export default function QrCode({
  value,
  size = 200,
  downloadName = "codigo-qr-orientapp",
  showActions = true,
}: {
  value: string;
  size?: number;
  downloadName?: string;
  showActions?: boolean;
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

  const handlePrint = () => {
    if (!dataUrl) return;
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) return;
    win.document.write(
      `<html><head><title>${downloadName}</title></head>` +
        `<body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">` +
        `<img src="${dataUrl}" alt="Código QR" style="width:320px;height:320px;" />` +
        `<p style="font-size:13px;word-break:break-all;max-width:360px;text-align:center;">${value}</p>` +
        `</body></html>`
    );
    win.document.close();
    win.focus();
    win.print();
  };

  if (error) {
    return <span className="muted">{error}</span>;
  }
  if (!dataUrl) {
    return <span className="muted">Generando QR…</span>;
  }
  return (
    <span className="stack center" style={{ gap: 8 }}>
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
      {showActions ? (
        <span className="row" style={{ gap: 8 }}>
          <a
            className="btn btn-secondary"
            href={dataUrl}
            download={`${downloadName}.png`}
          >
            Descargar
          </a>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
          >
            Imprimir
          </button>
        </span>
      ) : null}
    </span>
  );
}
