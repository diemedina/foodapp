/**
 * `pg` 8 avisa que `sslmode=require` (lo que trae la URL de Neon) se trata como `verify-full`
 * y que eso cambiará en pg 9. Pedimos `verify-full` explícitamente: es el comportamiento
 * actual, el más seguro, y Neon usa certificados públicos, así que la verificación funciona.
 */
export function withVerifiedSsl(url: string): string {
  return url.replace(/([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/, "$1sslmode=verify-full");
}
