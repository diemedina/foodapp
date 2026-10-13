import { PageTransition } from "@/components/page-transition";
import { dow, mondayOf, rangeText, todayISO } from "@/lib/dates";
import { buildShoppingList } from "@/lib/shopping";
import { getPlan, getRecipes, getShoppingState } from "@/server/queries";
import { ShoppingView } from "./shopping-view";

export default async function ShoppingPage(props: PageProps<"/compras">) {
  const params = await props.searchParams;
  const recipes = await getRecipes();
  const today = todayISO();
  const w = params.w === "1" ? 1 : params.w === "0" ? 0 : dow(today) >= 4 ? 1 : 0;
  const monday = mondayOf(today, w);
  const [plan, state] = await Promise.all([getPlan(monday), getShoppingState(monday)]);
  const list = buildShoppingList({
    plan,
    recipesById: new Map(recipes.map((r) => [r.id, r])),
    pantry: state.pantry,
    sectionOrder: state.order,
    checks: state.checks,
  });

  return (
    <PageTransition>
      <ShoppingView
        key={monday}
        offset={w}
        monday={monday}
        ranges={[rangeText(mondayOf(today)), rangeText(mondayOf(today, 1))]}
        list={list}
        household={state.household}
        sectionOrder={state.order}
      />
    </PageTransition>
  );
}
