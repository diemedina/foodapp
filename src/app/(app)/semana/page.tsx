import { PageTransition } from "@/components/page-transition";
import { dow, weekStartOf, rangeText, todayISO } from "@/lib/dates";
import { getPlan, getRecipes, getTemplates, getUsage } from "@/server/queries";
import { WeekPlanner } from "./week-planner";

export default async function WeekPage(props: PageProps<"/semana">) {
  const params = await props.searchParams;
  const recipes = await getRecipes();
  const today = todayISO();
  const lateWeek = dow(today) >= 4;
  const w = params.w === "1" ? 1 : params.w === "0" ? 0 : lateWeek ? 1 : 0;
  const weekStart = weekStartOf(today, w);
  const currentWeekStart = weekStartOf(today);
  const dParam = Number(params.d);
  const initialDay = Number.isInteger(dParam) && dParam >= 0 && dParam <= 6 ? dParam : w === 0 ? dow(today) : 0;

  const [plan, usage, templates, currentPlan] = await Promise.all([getPlan(weekStart), getUsage(), getTemplates(), w === 1 ? getPlan(currentWeekStart) : null]);

  return (
    <PageTransition>
      <WeekPlanner
        key={weekStart}
        offset={w}
        weekStart={weekStart}
        currentWeekStart={currentWeekStart}
        todayIndex={w === 0 ? dow(today) : -1}
        initialDay={initialDay}
        ranges={[rangeText(currentWeekStart), rangeText(weekStartOf(today, 1))]}
        plan={plan}
        currentPlan={currentPlan}
        recipes={recipes}
        usage={usage}
        templates={templates}
      />
    </PageTransition>
  );
}
