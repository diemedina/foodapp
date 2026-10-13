import { PageTransition } from "@/components/page-transition";
import { dow, hourNow, longDate, mondayOf, rangeText, todayISO } from "@/lib/dates";
import { mealForHour } from "@/lib/meals";
import { plannedCount } from "@/lib/planning";
import { buildShoppingList } from "@/lib/shopping";
import { getPlan, getRecipes, getShoppingState, getUsage } from "@/server/queries";
import { TodayView } from "./today-view";

export default async function TodayPage() {
  const recipes = await getRecipes();
  const now = new Date();
  const today = todayISO(now);
  const monday = mondayOf(today);
  const nextMonday = mondayOf(today, 1);
  const lateWeek = dow(today) >= 4;
  const shopMonday = lateWeek ? nextMonday : monday;

  const [plan, nextPlan, usage, shopState, shopPlan] = await Promise.all([
    getPlan(monday),
    getPlan(nextMonday),
    getUsage(),
    getShoppingState(shopMonday),
    lateWeek ? getPlan(nextMonday) : getPlan(monday),
  ]);
  const shopping = buildShoppingList({
    plan: shopPlan,
    recipesById: new Map(recipes.map((r) => [r.id, r])),
    pantry: shopState.pantry,
    sectionOrder: shopState.order,
    checks: shopState.checks,
  });
  const pendingHousehold = shopState.household.filter((h) => !h.checked).length;

  return (
    <PageTransition>
      <TodayView
        today={today}
        todayIndex={dow(today)}
        dateText={longDate(today)}
        monday={monday}
        nowMeal={mealForHour(hourNow(now))}
        plan={plan}
        recipes={recipes}
        usage={usage}
        lateWeek={lateWeek}
        nextPlanned={plannedCount(nextPlan)}
        nextRange={rangeText(nextMonday)}
        thisPlanned={plannedCount(plan)}
        pending={shopping.pending + pendingHousehold}
      />
    </PageTransition>
  );
}
