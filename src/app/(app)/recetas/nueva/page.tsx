import { PageTransition } from "@/components/page-transition";
import { RecipeForm } from "../recipe-form";

export default function NewRecipePage() {
  return (
    <PageTransition>
      <RecipeForm />
    </PageTransition>
  );
}
