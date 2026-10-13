import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 pb-[calc(124px+env(safe-area-inset-bottom))] pt-[calc(20px+env(safe-area-inset-top))]">
        {children}
      </main>
      <Suspense>
        <BottomNav />
      </Suspense>
    </>
  );
}
