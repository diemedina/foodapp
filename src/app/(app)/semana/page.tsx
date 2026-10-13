import { PageTransition } from "@/components/page-transition";
import { dow, mondayOf, rangeText, todayISO } from "@/lib/dates";
import { getPlan, getRecipes, getTemplates, getUsage } from "@/server/queries";
import { WeekPlanner } from "./week-planner";

export default async function WeekPage(props: PageProps<"/semana">) {
  const params = await props.searchParams;
  const recipes = await getRecipes();
  const today = todayISO();
  const lateWeek = dow(today) >= 4;
  const w = params.w === "1" ? 1 : params.w === "0" ? 0 : lateWeek ? 1 : 0;
  const monday = mondayOf(today, w);
  const currentMonday = mondayOf(today);
  const dParam = Number(params.d);
  const initialDay = Number.isInteger(dParam) && dParam >= 0 && dParam <= 6 ? dParam : w === 0 ? dow(today) : 0;

  const [plan, usage, templates] = await Promise.all([getPlan(monday), getUsage(), getTemplates()]);

  return (
    <PageTransition>
      <WeekPlanner
        key={monday}
        offset={w}
        monday={monday}
        currentMonday={currentMonday}
        todayIndex={w === 0 ? dow(today) : -1}
        initialDay={initialDay}
        ranges={[rangeText(currentMonday), rangeText(mondayOf(today, 1))]}
        plan={plan}
        recipes={recipes}
        usage={usage}
        templates={templates}
      />
    </PageTransition>
  );
}
