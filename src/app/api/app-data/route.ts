import { appTimeZone, todayISO, weekStartOf } from "@/lib/dates";
import type { AppData } from "@/lib/app-data";
import { assertAccess } from "@/server/auth";
import { getPlan, getRecipes, getShoppingState, getTemplates, getUsage } from "@/server/queries";

export async function GET() {
  await assertAccess();
  const today = todayISO();
  const weeks: [string, string] = [weekStartOf(today), weekStartOf(today, 1)];
  const [recipes, current, next, usage, templates, shopping] = await Promise.all([
    getRecipes(),
    getPlan(weeks[0]),
    getPlan(weeks[1]),
    getUsage(),
    getTemplates(),
    getShoppingState(weeks),
  ]);
  const data: AppData = {
    timeZone: appTimeZone(),
    weeks,
    plans: { [weeks[0]]: current, [weeks[1]]: next },
    recipes,
    usage,
    templates,
    shopping,
  };
  return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
