import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Acceso simple para 2 personas: no hay cuentas. Quien conoce ACCESS_CODE
 * lo ingresa una vez y queda guardado en una cookie httpOnly (como hash, no en texto plano).
 */
export const ACCESS_COOKIE = "foodapp_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

function hash(value: string): string {
  return createHash("sha256").update(`foodapp:${value}`).digest("hex");
}

/** Token esperado en la cookie, o null si no se configuró ACCESS_CODE (modo abierto, útil en desarrollo). */
export function expectedToken(): string | null {
  const code = process.env.ACCESS_CODE;
  return code ? hash(code) : null;
}

export function tokenForCode(code: string): string {
  return hash(code.trim());
}

export function isValidToken(token: string | undefined | null): boolean {
  const expected = expectedToken();
  if (!expected) return true;
  if (!token || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Las Server Actions también se protegen: son POST que podrían llamarse sin pasar por una página. */
export async function assertAccess(): Promise<void> {
  const store = await cookies();
  if (!isValidToken(store.get(ACCESS_COOKIE)?.value)) {
    throw new Error("No autorizado: ingresá el código de acceso.");
  }
}
