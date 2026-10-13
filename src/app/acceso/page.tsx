import { AccessForm } from "./access-form";

export const metadata = { title: "Entrar · Organizador de comidas" };

export default function AccessPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-muted">Organizador de comidas</span>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Ingresá el código de acceso</h1>
        <p className="text-muted">Se pide una sola vez en cada teléfono.</p>
      </div>
      <AccessForm />
    </main>
  );
}
