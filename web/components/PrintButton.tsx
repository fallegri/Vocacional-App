"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => window.print()}
    >
      Imprimir / Guardar como PDF
    </button>
  );
}
