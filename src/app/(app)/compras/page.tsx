"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppDataFallback } from "@/components/app-data";
import { PageTransition } from "@/components/page-transition";
import { ListSkeleton } from "@/components/skeletons";
import { shoppingListFor } from "@/lib/app-data";
import { useAppStore } from "@/lib/app-store";
import { isSectionCategory } from "@/lib/sections";
import { dow, rangeText, todayISO } from "@/lib/dates";
import { ShoppingView } from "./shopping-view";

function ShoppingContent() {
  const params = useSearchParams();
  const data = useAppStore((state) => state.data);
  if (!data) return <AppDataFallback><ListSkeleton /></AppDataFallback>;

  const today = todayISO(new Date(), data.timeZone);
  const week = params.get("w");
  const offset = week === "1" ? 1 : week === "0" ? 0 : dow(today) >= 4 ? 1 : 0;
  const weekStart = data.weeks[offset];

  return (
    <ShoppingView
      key={weekStart}
      offset={offset}
      weekStart={weekStart}
      ranges={data.weeks.map(rangeText)}
      list={shoppingListFor(data, weekStart)}
      household={data.shopping.household.filter((item) => !isSectionCategory(item.category))}
      sectionOrder={data.shopping.order}
    />
  );
}

export default function ShoppingPage() {
  return (
    <PageTransition>
      <Suspense fallback={<ListSkeleton />}>
        <ShoppingContent />
      </Suspense>
    </PageTransition>
  );
}
