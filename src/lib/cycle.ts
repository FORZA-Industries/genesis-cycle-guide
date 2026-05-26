// Pure cycle math helpers — no React, no Supabase, safe to import anywhere.

export type Phase = "period" | "follicular" | "ovulatory" | "luteal";
// Calendar/legend phase tokens used by Track screen day cells.
export type DayType = "period" | "follicular" | "fertile" | "ovulation" | "luteal";

export type CyclePhaseInfo = {
  dayOfCycle: number;            // 1..cycleLength
  phase: Phase;
  fertileWindow: boolean;
  ovulationDay: number;          // cycleLength - 14
  daysUntilNextPeriod: number;   // 0..cycleLength-1
};

const MS_PER_DAY = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole-day difference (target - origin), ignoring time of day. */
export function daysBetween(origin: Date, target: Date): number {
  return Math.floor((startOfDay(target).getTime() - startOfDay(origin).getTime()) / MS_PER_DAY);
}

export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) return startOfDay(value);
  // 'YYYY-MM-DD' — parse as local date to avoid TZ shift
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Compute the cycle phase for `targetDate` given the user's last period start
 * and cycle parameters. Ovulation = cycleLength - 14.
 * Fertile window = [ovulation - 5, ovulation + 1] inclusive.
 */
export function getCyclePhase(
  lastPeriodDate: string | Date,
  cycleLength: number,
  periodLength: number,
  targetDate: string | Date = new Date(),
): CyclePhaseInfo {
  const start = parseDateOnly(lastPeriodDate);
  const target = parseDateOnly(targetDate);
  const diff = daysBetween(start, target);
  // Wrap into 1..cycleLength
  const mod = ((diff % cycleLength) + cycleLength) % cycleLength;
  const dayOfCycle = mod + 1;

  const ovulationDay = cycleLength - 14;
  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;
  const inFertile = dayOfCycle >= fertileStart && dayOfCycle <= fertileEnd;

  let phase: Phase;
  if (dayOfCycle <= periodLength) phase = "period";
  else if (dayOfCycle === ovulationDay) phase = "ovulatory";
  else if (dayOfCycle < ovulationDay) phase = "follicular";
  else phase = "luteal";

  const daysUntilNextPeriod = cycleLength - dayOfCycle + 1 === cycleLength
    ? 0
    : cycleLength - dayOfCycle;

  return {
    dayOfCycle,
    phase,
    fertileWindow: inFertile,
    ovulationDay,
    daysUntilNextPeriod,
  };
}

/** Map a phase + fertile flag to the legacy DayType used by the calendar legend. */
export function dayTypeFor(info: CyclePhaseInfo): DayType {
  if (info.phase === "period") return "period";
  if (info.dayOfCycle === info.ovulationDay) return "ovulation";
  if (info.fertileWindow) return "fertile";
  if (info.phase === "luteal") return "luteal";
  return "follicular";
}

/** Cycle number = how many full cycles since lastPeriodDate, +1 (current). */
export function cycleNumberFor(lastPeriodDate: string | Date, cycleLength: number, target: Date = new Date()): number {
  const start = parseDateOnly(lastPeriodDate);
  const diff = Math.max(0, daysBetween(start, target));
  return Math.floor(diff / cycleLength) + 1;
}

/** Build a calendar grid for the month containing `monthAnchor`, with phase
 * info for each day (or null for empty leading/trailing slots). */
export type CalendarCell =
  | { kind: "empty" }
  | { kind: "day"; date: Date; info: CyclePhaseInfo; isToday: boolean };

export function buildMonthGrid(
  monthAnchor: Date,
  lastPeriodDate: string | Date,
  cycleLength: number,
  periodLength: number,
): CalendarCell[] {
  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const last = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);
  const today = startOfDay(new Date());
  const cells: CalendarCell[] = [];
  // Leading empties — week starts Sunday (matches header row "S M T W T F S")
  for (let i = 0; i < first.getDay(); i++) cells.push({ kind: "empty" });
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(first.getFullYear(), first.getMonth(), d);
    cells.push({
      kind: "day",
      date,
      info: getCyclePhase(lastPeriodDate, cycleLength, periodLength, date),
      isToday: date.getTime() === today.getTime(),
    });
  }
  // Trailing empties to complete the last row
  while (cells.length % 7 !== 0) cells.push({ kind: "empty" });
  return cells;
}

export const phaseLabel: Record<Phase, string> = {
  period: "Period",
  follicular: "Follicular Phase",
  ovulatory: "Ovulatory Phase",
  luteal: "Luteal Phase",
};

export const phaseHeroCopy: Record<Phase, { hero: string; sub: string; tags: string[]; focus: { title: string; body: string } }> = {
  period: {
    hero: "Rest and replenish your body",
    sub: "Energy is naturally lower — choose iron-rich, warming meals.",
    tags: ["Low estrogen", "Restore iron"],
    focus: { title: "Add a warm iron-rich meal", body: "Lentils, beef, or dark greens help replenish what's lost." },
  },
  follicular: {
    hero: "Building energy for ovulation",
    sub: "Estrogen is rising. Focus on fresh, nutrient-dense foods.",
    tags: ["Estrogen rising", "Building energy"],
    focus: { title: "Add 2 cups of leafy greens", body: "Folate-forward foods support egg quality." },
  },
  ovulatory: {
    hero: "High chance of conception today",
    sub: "Ovulation expected in 1–2 days. Stay hydrated and rested.",
    tags: ["High estrogen", "Peak energy"],
    focus: { title: "Hydrate and prioritise protein", body: "Eggs, salmon, and avocado support hormone balance." },
  },
  luteal: {
    hero: "Slow down and nourish",
    sub: "Progesterone rises. Choose magnesium-rich foods to ease symptoms.",
    tags: ["Progesterone rising", "Lower energy"],
    focus: { title: "Try a magnesium-rich snack", body: "Pumpkin seeds, dark chocolate, or bananas help mood + sleep." },
  },
};

export type Food = { title: string; desc: string };
export const phaseFoods: Record<Phase, Food[]> = {
  period: [
    { title: "Lentils & beans", desc: "Plant iron to replenish what's lost during menstruation." },
    { title: "Dark leafy greens", desc: "Spinach and kale pair iron with folate for steady energy." },
    { title: "Bone broth", desc: "Warming, mineral-rich, gentle on a tender gut." },
    { title: "Dark chocolate", desc: "Magnesium to soften cramps and lift mood." },
  ],
  follicular: [
    { title: "Sprouted grains", desc: "Steady carbs for rising estrogen and morning energy." },
    { title: "Fermented foods", desc: "Kimchi or kefir support estrogen metabolism." },
    { title: "Citrus & berries", desc: "Vitamin C supports collagen and egg quality." },
    { title: "Pumpkin seeds", desc: "Zinc to fuel the building phase of your cycle." },
  ],
  ovulatory: [
    { title: "Wild salmon", desc: "Omega-3s support hormone balance at ovulation." },
    { title: "Avocado", desc: "Healthy fats help your body use estrogen well." },
    { title: "Eggs", desc: "Choline and B12 — a complete fertility breakfast." },
    { title: "Leafy greens", desc: "Folate supports cell division and conception." },
  ],
  luteal: [
    { title: "Sweet potato", desc: "Slow carbs to steady progesterone-driven cravings." },
    { title: "Pumpkin seeds", desc: "Magnesium to ease PMS and improve sleep." },
    { title: "Bananas", desc: "B6 to lift mood as the luteal phase winds down." },
    { title: "Turkey", desc: "Tryptophan helps with rest and calm." },
  ],
};
