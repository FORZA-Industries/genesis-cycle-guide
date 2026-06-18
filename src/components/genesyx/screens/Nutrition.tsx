import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { articles } from "../mockData";
import { Droplets, ChevronRight, Pill, Minus, Plus } from "lucide-react";
import { useCycleSettings } from "@/hooks/use-cycle";
import { useDailyLog } from "@/hooks/use-daily-log";
import { getCyclePhase, phaseLabel, type Phase } from "@/lib/cycle";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const WATER_TARGET = 2400;
const WATER_STEP = 200;

type FoodItem = {
  name: string;
  shortDesc: string;
  expandedDesc: string;
  color: string;
};

const PHASE_FOODS: Record<Phase, FoodItem[]> = {
  period: [
    { name: "Iron-rich foods", shortDesc: "Replenish iron lost during bleeding.", expandedDesc: "Red meat, lentils, and dark leafy greens help restore iron levels. Pair with vitamin C (like lemon juice) to boost absorption. Aim for 2–3 servings daily during your period.", color: "#F48FB1" },
    { name: "Anti-inflammatory foods", shortDesc: "Reduce cramping and inflammation.", expandedDesc: "Omega-3 fatty acids found in salmon, chia seeds, and walnuts reduce prostaglandins that cause cramps. Turmeric in warm milk is a traditional remedy with scientific backing.", color: "#F48FB1" },
    { name: "Warming foods", shortDesc: "Support circulation and comfort.", expandedDesc: "Ginger tea, warm soups, and cooked root vegetables are easier to digest and support circulation. Avoid cold, raw foods which can increase cramping for some people.", color: "#F48FB1" },
  ],
  follicular: [
    { name: "Fermented foods", shortDesc: "Support gut health and rising estrogen.", expandedDesc: "Yoghurt, kefir, kimchi, and sauerkraut feed your gut microbiome, which plays a role in metabolising estrogen. A healthy gut supports hormonal balance throughout your cycle.", color: "#A5D6A7" },
    { name: "Sprouted seeds", shortDesc: "Phytoestrogens to support follicle growth.", expandedDesc: "Flaxseeds and pumpkin seeds contain lignans and zinc that support follicle development. Add to smoothies, yoghurt, or salads. Start seed cycling with flax + pumpkin in the first half of your cycle.", color: "#A5D6A7" },
    { name: "Light proteins", shortDesc: "Fuel energy without heaviness.", expandedDesc: "Eggs, tofu, and legumes provide amino acids for tissue repair and hormone production. Your digestion is stronger in the follicular phase, so it is a good time to try new foods.", color: "#A5D6A7" },
  ],
  ovulatory: [
    { name: "Leafy greens", shortDesc: "Folate-rich foods to support egg quality.", expandedDesc: "Spinach, kale, and rocket are rich in folate (B9), which supports egg quality and early fetal development if conception occurs. Aim for 2 generous handfuls per day during your fertile window.", color: "#CE93D8" },
    { name: "Complex carbs", shortDesc: "Steady energy and balanced blood sugar.", expandedDesc: "Quinoa, sweet potato, and brown rice provide slow-release energy to support your peak activity levels. Avoid refined sugars which can cause energy crashes during your fertile window.", color: "#CE93D8" },
    { name: "Zinc-rich foods", shortDesc: "Support ovulation and immune function.", expandedDesc: "Pumpkin seeds, shellfish, and beef liver are excellent zinc sources. Zinc is essential for the LH surge that triggers ovulation. Low zinc is linked to irregular ovulation.", color: "#CE93D8" },
    { name: "Antioxidant foods", shortDesc: "Protect egg quality from oxidative stress.", expandedDesc: "Berries, colourful peppers, and tomatoes are rich in vitamins C and E. Antioxidants neutralise free radicals that can damage eggs. Include a rainbow of colours in each meal.", color: "#CE93D8" },
  ],
  luteal: [
    { name: "Magnesium-rich foods", shortDesc: "Ease PMS symptoms and support sleep.", expandedDesc: "Dark chocolate (70%+), almonds, spinach, and pumpkin seeds are high in magnesium. Studies show magnesium supplementation reduces PMS severity including mood changes, bloating, and cramps.", color: "#B39DDB" },
    { name: "B6 foods", shortDesc: "Support progesterone and reduce mood swings.", expandedDesc: "Salmon, chicken, bananas, and sunflower seeds are rich in vitamin B6, which supports progesterone production and serotonin synthesis. Low B6 is strongly associated with PMS.", color: "#B39DDB" },
    { name: "Fibre-rich foods", shortDesc: "Support estrogen clearance.", expandedDesc: "As progesterone rises, your gut slows down. Oats, flaxseeds, and vegetables support bowel regularity and help clear excess estrogen from the body, reducing PMS bloating.", color: "#B39DDB" },
    { name: "Complex carbs", shortDesc: "Reduce cravings and stabilise mood.", expandedDesc: "Serotonin dips in the luteal phase, causing carb cravings. Complex carbs like oats, lentils, and whole grain bread boost serotonin naturally without the crash from refined sugar.", color: "#B39DDB" },
  ],
};

const PHASE_DESCRIPTION: Record<Phase, string> = {
  period: "Foods to restore and replenish during your cycle.",
  follicular: "Foods to support rising energy and hormone balance.",
  ovulatory: "Foods chosen to gently support your body through this week of your cycle.",
  luteal: "Foods to ease PMS and support your winding-down phase.",
};

export function NutritionScreen() {
  const { settings, loading } = useCycleSettings();
  const { log, save } = useDailyLog();
  const info = settings
    ? getCyclePhase(settings.lastPeriodDate, settings.cycleLength, settings.periodLength)
    : null;
  const phase: Phase | null = info?.phase ?? null;
  const foods = phase ? PHASE_FOODS[phase] : [];
  const [expandedFood, setExpandedFood] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  const [waterMl, setWaterMl] = useState<number>(0);
  useEffect(() => { if (log) setWaterMl(log.waterMl); }, [log]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueSave = (next: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save({ waterMl: next }).catch(() => {});
    }, 500);
  };
  const bump = (delta: number) => {
    const next = Math.max(0, Math.min(10000, waterMl + delta));
    setWaterMl(next);
    queueSave(next);
  };

  const pct = Math.min(100, Math.round((waterMl / WATER_TARGET) * 100));
  const remaining = Math.max(0, WATER_TARGET - waterMl);

  const headerLabel = phase
    ? `TODAY · ${phaseLabel[phase].toUpperCase()}`
    : loading ? "TODAY · LOADING…" : "TODAY · SET UP YOUR CYCLE";
  const headerDesc = phase
    ? PHASE_DESCRIPTION[phase]
    : "Set up your cycle to get personalised nutrition guidance.";

  return (
    <div className="gx-screen pb-6">
      <div className="px-6 pt-3 pb-6">
        <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-primary">
          {headerLabel}
        </p>
        <h1 className="mt-2 font-display text-[32px] font-semibold leading-[1.05] tracking-tight">
          Your nutrition focus
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          {headerDesc}
        </p>
      </div>

      <div className="px-5 space-y-3">
        {/* Hydration */}
        <div className="rounded-[28px] bg-card p-5 gx-card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Hydration</p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-semibold tracking-tight">{(waterMl / 1000).toFixed(1)}</span>
                <span className="text-[13px] text-muted-foreground">/ {(WATER_TARGET / 1000).toFixed(1)} L</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => bump(-WATER_STEP)} aria-label="Remove" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70">
                <Minus className="h-4 w-4" />
              </button>
              <button onClick={() => bump(WATER_STEP)} aria-label="Add" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Progress value={pct} className="mt-4 h-1.5 bg-muted [&>div]:bg-foreground" />
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Droplets className="h-3.5 w-3.5" />
            <span>{remaining > 0 ? `${remaining}ml to go` : "Target reached — nice work"}</span>
          </div>
        </div>

        {/* Focus foods — phase-driven, expandable */}
        <div className="rounded-[28px] bg-card overflow-hidden gx-card-shadow">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Focus foods</p>
            <p className="mt-1 font-display text-[18px] font-semibold tracking-tight">
              {phase ? "Your focus foods this phase" : "Set up your cycle to see your foods"}
            </p>
          </div>
          {!phase ? (
            <div className="px-5 pb-5 text-[13.5px] leading-relaxed text-muted-foreground">
              Set up your cycle to see food recommendations.
            </div>
          ) : (
            <ul>
              {foods.map((f, i) => {
                const open = expandedFood === f.name;
                return (
                  <li key={f.name}>
                    <button
                      type="button"
                      onClick={() => setExpandedFood(open ? null : f.name)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors active:bg-muted/40"
                    >
                      <span
                        className="mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: f.color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[15.5px] font-semibold tracking-tight text-foreground">{f.name}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{f.shortDesc}</p>
                        <div
                          className={cn(
                            "grid transition-all duration-300 ease-out",
                            open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <div className="overflow-hidden">
                            <p className="text-[12.5px] leading-relaxed text-muted-foreground/80">
                              {f.expandedDesc}
                            </p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform", open && "rotate-90")} />
                    </button>
                    {i < foods.length - 1 && <div className="mx-5 h-px bg-border/60" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Supplements */}
        <div className="rounded-[28px] bg-card p-5 gx-card-shadow">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--electric-lavender)_8%,white)] text-primary">
              <Pill className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[16px] font-semibold tracking-tight">Your supplement plan</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Folate, Omega-3, Vitamin D, and Zinc — taken with breakfast.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {["F", "O", "D", "Z"].map((l, i) => (
                    <span
                      key={l}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-[10.5px] font-semibold text-primary"
                      style={{ zIndex: 10 - i }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
                <span className="text-[12px] text-muted-foreground">3 of 4 taken today</span>
              </div>
            </div>
          </div>
          <Button className="mt-5 h-12 w-full rounded-2xl bg-primary text-[14.5px] font-semibold hover:bg-primary/90">
            Review Plan
          </Button>
        </div>

        {/* Articles */}
        <div className="pt-4">
          <p className="mb-3 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Learn more</p>
          <div className="space-y-2">
            {articles.map((a) => (
              <button key={a.title} className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left gx-soft-shadow">
                <div className="min-w-0 pr-3">
                  <p className="text-[14.5px] font-medium leading-snug text-foreground">{a.title}</p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">{a.read}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
