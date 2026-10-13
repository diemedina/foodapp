"use client";

import { useActionState } from "react";
import { enterAccess, type AccessState } from "@/server/actions";

export function AccessForm() {
  const [state, action, pending] = useActionState<AccessState, FormData>(enterAccess, {});
  return (
    <form action={action} className="glass flex flex-col gap-3 rounded-[24px] p-4">
      <label htmlFor="code" className="text-[13px] font-semibold text-[#4A4038]">
        Código
      </label>
      <input
        id="code"
        name="code"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="h-[52px] rounded-[18px] border border-ink/10 bg-white/85 px-[18px] text-[17px] tracking-widest"
      />
      {state.error && (
        <p role="alert" className="text-[13px] font-semibold text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-[52px] rounded-full bg-ink text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
