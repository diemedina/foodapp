"use client";

import { useRouter } from "next/navigation";
import { writeAppData } from "@/lib/app-store";
import { useState, useTransition } from "react";
import { TrashIcon } from "@/components/icons";
import { useToast } from "@/components/toast";
import { deleteRecipe } from "@/server/actions";

/** Pide un segundo toque para confirmar, sin diálogos del navegador. */
export function DeleteRecipeButton({ id }: { id: number }) {
  const toast = useToast();
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={armed ? "Tocá de nuevo para eliminar" : "Eliminar receta"}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          setTimeout(() => setArmed(false), 3000);
          return;
        }
        startTransition(async () => {
          try {
            await writeAppData(() => deleteRecipe({ id }));
            router.push("/recetas?eliminada=1");
          } catch {
            toast("No se pudo eliminar.", "error");
          }
        });
      }}
      className={`flex h-[52px] items-center justify-center gap-2 rounded-full border text-sm font-bold transition-all ${
        armed ? "flex-1 border-danger bg-danger text-white" : "w-[52px] border-ink/10 bg-white/70 text-danger"
      }`}
    >
      <TrashIcon className="size-5" />
      {armed && "¿Eliminar?"}
    </button>
  );
}
