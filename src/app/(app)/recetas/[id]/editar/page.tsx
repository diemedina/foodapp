import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { DetailSkeleton } from "@/components/skeletons";
import { ingredientToLine } from "@/lib/units";
import { getRecipe } from "@/server/queries";
import { RecipeForm } from "../../recipe-form";

async function EditRecipeContent(props: { params: PageProps<"/recetas/[id]/editar">["params"] }) {
  const { id } = await props.params;
  const recipe = await getRecipe(Number(id));
  if (!recipe) notFound();
  return (
    <RecipeForm
      initial={{
        id: recipe.id,
        name: recipe.name,
        meals: recipe.meals,
        ingredients: recipe.ings.map(ingredientToLine).join("\n"),
      }}
    />
  );
}

/** La pantalla se muestra al instante con su esqueleto y los datos llegan por streaming. */
export default function EditRecipePage(props: PageProps<"/recetas/[id]/editar">) {
  return (
    <PageTransition>
      <Suspense fallback={<DetailSkeleton />}>
        <EditRecipeContent params={props.params} />
      </Suspense>
    </PageTransition>
  );
}
