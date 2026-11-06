/**
 * Esqueletos de carga. Cada pantalla los muestra apenas se navega a ella (navegación instantánea)
 * mientras el servidor trae los datos de la base y los envía por streaming.
 */
function Bar({ className }: { className: string }) {
  return <div className={`rounded-full bg-ink/10 ${className}`} />;
}

function Card({ className }: { className: string }) {
  return <div className={`glass ${className}`} />;
}

export function TodaySkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-[18px]" aria-busy="true" aria-label="Cargando">
      <div className="flex flex-col gap-2 px-1">
        <Bar className="h-3.5 w-44" />
        <Bar className="h-7 w-56" />
      </div>
      <Bar className="h-9 w-full" />
      <Card className="h-[330px] rounded-[28px]" />
      <Card className="h-[76px] rounded-[22px]" />
      <Card className="h-[76px] rounded-[22px]" />
    </div>
  );
}

export function WeekSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-[18px]" aria-busy="true" aria-label="Cargando">
      <Card className="h-[52px] rounded-full" />
      <div className="h-[170px] rounded-[28px] bg-ink/80" />
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <Card key={i} className="h-[74px] rounded-[20px]" />
        ))}
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} className="h-[84px] rounded-[24px]" />
      ))}
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="h-[170px] rounded-[24px]" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-[18px]" aria-busy="true" aria-label="Cargando">
      <Bar className="h-8 w-28" />
      <Card className="h-40 rounded-[28px]" />
      <div className="flex flex-col gap-2 px-1">
        <Bar className="h-3.5 w-32" />
        <Bar className="h-7 w-64" />
      </div>
      <Card className="h-56 rounded-[20px]" />
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-busy="true" aria-label="Cargando">
      <Card className="h-[52px] rounded-full" />
      <Card className="h-[88px] rounded-[24px]" />
      <Card className="h-56 rounded-[24px]" />
      <Card className="h-40 rounded-[24px]" />
    </div>
  );
}
