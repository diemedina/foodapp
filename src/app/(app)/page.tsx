"use client";

import { AppDataFallback } from "@/components/app-data";
import { PageTransition } from "@/components/page-transition";
import { TodaySkeleton } from "@/components/skeletons";
import { shoppingListFor } from "@/lib/app-data";
import { useAppStore } from "@/lib/app-store";
import { dow, hourNow, longDate, rangeText, todayISO } from "@/lib/dates";
import { mealForHour } from "@/lib/meals";
import { plannedCount } from "@/lib/planning";
import { TodayView } from "./today-view";

function TodayContent() {
  const data = useAppStore((state) => state.data);
  if (!data) return <AppDataFallback><TodaySkeleton /></AppDataFallback>;

  const now = new Date();
  const today = todayISO(now, data.timeZone);
  const todayIndex = dow(today);
  const lateWeek = todayIndex >= 4;
  const [weekStart, nextWeekStart] = data.weeks;
  const plan = data.plans[weekStart];
  const shopping = shoppingListFor(data, lateWeek ? nextWeekStart : weekStart);

  return (
    <TodayView
      today={today}
      todayIndex={todayIndex}
      dateText={longDate(today)}
      weekStart={weekStart}
      nowMeal={mealForHour(hourNow(now, data.timeZone))}
      plan={plan}
      recipes={data.recipes}
      usage={data.usage}
      lateWeek={lateWeek}
      nextPlanned={plannedCount(data.plans[nextWeekStart])}
      nextRange={rangeText(nextWeekStart)}
      thisPlanned={plannedCount(plan)}
      pending={shopping.pending}
    />
  );
}

export default function TodayPage() {
  return <PageTransition><TodayContent /></PageTransition>;
}
