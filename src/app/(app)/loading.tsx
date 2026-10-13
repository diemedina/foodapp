/** Esqueleto que se muestra mientras el servidor arma la pantalla con los datos. */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-busy="true" aria-label="Cargando">
      <div className="h-4 w-40 rounded-full bg-ink/10" />
      <div className="h-8 w-60 rounded-full bg-ink/10" />
      <div className="glass h-72 rounded-[28px]" />
      <div className="glass h-20 rounded-[22px]" />
      <div className="glass h-20 rounded-[22px]" />
    </div>
  );
}
