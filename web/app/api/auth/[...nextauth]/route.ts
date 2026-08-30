// ===========================================================================
// Route handler de Auth.js v5: reexporta los handlers GET y POST desde la
// configuración central en web/auth.ts.
// ===========================================================================

import { handlers } from "@/auth";

export const runtime = "nodejs";

export const { GET, POST } = handlers;
