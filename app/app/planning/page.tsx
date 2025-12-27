import { requireMembership } from "@/lib/app-data";
import { parseWeeklySchedule, parseExceptions } from "@/lib/schedule";
import { getNowInTz, ymdInTz } from "@/lib/timezone";
import { PlanningCalendarClient } from "@/components/app/PlanningCalendarClient";

export default async function PlanningPage({
  searchParams
}: {
  searchParams?: Promise<{ view?: string; date?: string }>;
}) {
  const { membership, household } = await requireMembership();

  const tz = household.timezone || "Europe/Paris";
  const weekly = parseWeeklySchedule(household.workScheduleWeekly);
  const exceptions = parseExceptions(household.workScheduleExceptions);

  const todayYmd = ymdInTz(getNowInTz(tz), tz);
  const resolved = await searchParams;
  const date = typeof resolved?.date === "string" ? resolved.date : todayYmd;
  const view = resolved?.view === "week" || resolved?.view === "month" ? resolved.view : "day";

  return (
    <PlanningCalendarClient
      tz={tz}
      role={membership.role}
      initialDateYmd={date}
      initialView={view}
      weekly={weekly}
      exceptions={exceptions}
    />
  );
}
