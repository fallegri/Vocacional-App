"use client";

/**
 * @deprecated (FEAT-002) La autorización ahora es por ROL vía OAuth (Google).
 * Este componente ya NO está conectado a la UI de administración; se conserva
 * solo como referencia del antiguo flujo de token compartido
 * (STAFF_ACCESS_TOKEN), que persiste únicamente como fallback local/demo en el
 * servidor. No lo vuelvas a cablear en las pantallas de administración.
 *
 * Campo para introducir el token de personal. Solo se muestra cuando el
 * servidor exige token (STAFF_ACCESS_TOKEN definido, `enabled === true`). El
 * valor se guarda en sessionStorage vía useStaffToken y se reenvía con cada
 * mutación de personal.
 */
export default function StaffTokenField({
  enabled,
  token,
  setToken,
}: {
  enabled: boolean;
  token: string;
  setToken: (value: string) => void;
}) {
  if (!enabled) return null;

  return (
    <div className="card card-muted">
      <label className="label" htmlFor="staff-token">
        Token de acceso del personal
      </label>
      <input
        id="staff-token"
        className="input"
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Introduce el token de personal para autorizar cambios"
        autoComplete="off"
      />
      <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
        Requerido para crear cohortes, subir documentos, guardar la
        configuración de IA y firmar dictámenes. Se guarda solo en esta pestaña.
      </p>
    </div>
  );
}
