"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppDataFallback } from "@/components/app-data";
import { PageTransition } from "@/components/page-transition";
import { WeekSkeleton } from "@/components/skeletons";
import { useAppStore } from "@/lib/app-store";
import { dow, rangeText, todayISO } from "@/lib/dates";
import { WeekPlanner } from "./week-planner";

function WeekContent() {
  const params = useSearchParams();
  const data = useAppStore((state) => state.data);
  if (!data) return <AppDataFallback><WeekSkeleton /></AppDataFallback>;

  const todayIndex = dow(todayISO(new Date(), data.timeZone));
  const week = params.get("w");
  const offset = week === "1" ? 1 : week === "0" ? 0 : todayIndex >= 4 ? 1 : 0;
  const weekStart = data.weeks[offset];
  const currentWeekStart = data.weeks[0];
  const dayParam = params.get("d");
  const day = dayParam === null ? NaN : Number(dayParam);
  const initialDay = Number.isInteger(day) && day >= 0 && day <= 6 ? day : offset === 0 ? todayIndex : 0;

  return (
    <WeekPlanner
      key={`${weekStart}:${dayParam ?? ""}`}
      offset={offset}
      weekStart={weekStart}
      currentWeekStart={currentWeekStart}
      todayIndex={offset === 0 ? todayIndex : -1}
      initialDay={initialDay}
      ranges={data.weeks.map(rangeText)}
      plan={data.plans[weekStart]}
      currentPlan={offset === 1 ? data.plans[currentWeekStart] : null}
      recipes={data.recipes}
      usage={data.usage}
      templates={data.templates}
    />
  );
}

export default function WeekPage() {
  return (
    <PageTransition>
      <Suspense fallback={<WeekSkeleton />}>
        <WeekContent />
      </Suspense>
    </PageTransition>
  );
}
