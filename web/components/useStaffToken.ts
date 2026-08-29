"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * @deprecated (FEAT-002) La autorización ahora es por ROL vía OAuth (Google) y
 * este hook ya NO se usa en la UI de administración. Se conserva solo como
 * referencia del antiguo flujo de token compartido (STAFF_ACCESS_TOKEN), que
 * persiste únicamente como fallback local/demo en el servidor.
 *
 * Token de personal (staff) para autorizar mutaciones cuando el servidor tiene
 * definido STAFF_ACCESS_TOKEN. Se guarda en sessionStorage (solo en el
 * navegador, se borra al cerrar la pestaña) y se reenvía con cada mutación:
 *  - en las server actions como argumento `staffToken`;
 *  - en las llamadas fetch mediante la cabecera `x-staff-token`.
 *
 * NUNCA se persiste en localStorage ni se envía a terceros. Cuando el servidor
 * corre en modo demo (sin STAFF_ACCESS_TOKEN), el token puede quedar vacío.
 */
const STORAGE_KEY = "orientapp.staffToken";

export function useStaffToken(): {
  token: string;
  setToken: (value: string) => void;
} {
  const [token, setTokenState] = useState<string>("");

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) setTokenState(stored);
    } catch {
      // sessionStorage no disponible: se ignora.
    }
  }, []);

  const setToken = useCallback((value: string) => {
    setTokenState(value);
    try {
      if (value) window.sessionStorage.setItem(STORAGE_KEY, value);
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage no disponible: se ignora.
    }
  }, []);

  return { token, setToken };
}

/** Cabecera HTTP para reenviar el token de personal en llamadas fetch. */
export const STAFF_TOKEN_HEADER = "x-staff-token";
