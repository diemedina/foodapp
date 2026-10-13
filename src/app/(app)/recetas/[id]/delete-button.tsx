"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "@/components/icons";
import { useToast } from "@/components/toast";
import { deleteRecipe } from "@/server/actions";

/** Pide un segundo toque para confirmar, sin diálogos del navegador. */
export function DeleteRecipeButton({ id }: { id: number }) {
  const toast = useToast();
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
            await deleteRecipe({ id });
          } catch (e) {
            // redirect() también llega acá como excepción especial: solo avisamos si es un error real.
            if (e instanceof Error && !("digest" in e)) toast("No se pudo eliminar.", "error");
            else throw e;
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
