import { notFound } from "next/navigation";
import { PageTransition } from "@/components/page-transition";
import { ingredientToLine } from "@/lib/units";
import { getRecipe } from "@/server/queries";
import { RecipeForm } from "../../recipe-form";

export default async function EditRecipePage(props: PageProps<"/recetas/[id]/editar">) {
  const { id } = await props.params;
  const recipe = await getRecipe(Number(id));
  if (!recipe) notFound();
  return (
    <PageTransition>
      <RecipeForm
        initial={{
          id: recipe.id,
          name: recipe.name,
          meals: recipe.meals,
          ingredients: recipe.ings.map(ingredientToLine).join("\n"),
        }}
      />
    </PageTransition>
  );
}
