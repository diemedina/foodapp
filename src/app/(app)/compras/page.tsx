import { PageTransition } from "@/components/page-transition";
import { dow, weekStartOf, rangeText, todayISO } from "@/lib/dates";
import { buildShoppingList } from "@/lib/shopping";
import { getPlan, getRecipes, getShoppingState } from "@/server/queries";
import { ShoppingView } from "./shopping-view";

export default async function ShoppingPage(props: PageProps<"/compras">) {
  const params = await props.searchParams;
  const recipes = await getRecipes();
  const today = todayISO();
  const w = params.w === "1" ? 1 : params.w === "0" ? 0 : dow(today) >= 4 ? 1 : 0;
  const weekStart = weekStartOf(today, w);
  const [plan, state] = await Promise.all([getPlan(weekStart), getShoppingState(weekStart)]);
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
        key={weekStart}
        offset={w}
        weekStart={weekStart}
        ranges={[rangeText(weekStartOf(today)), rangeText(weekStartOf(today, 1))]}
        list={list}
        household={state.household}
        sectionOrder={state.order}
      />
    </PageTransition>
  );
}
