export const quizQuestions = [
  {
    id: "stage",
    question: "Where are you in your conception journey?",
    helper: "There's no wrong answer — we'll tailor your experience.",
    options: [
      { id: "exploring", label: "Just starting to think about it" },
      { id: "preparing", label: "Actively preparing my body" },
      { id: "trying", label: "Trying to conceive now" },
      { id: "support", label: "Looking for extra support" },
    ],
  },
  {
    id: "cycle",
    question: "How regular does your cycle usually feel?",
    helper: "An honest answer helps us personalise your insights.",
    options: [
      { id: "very", label: "Very regular, predictable" },
      { id: "mostly", label: "Mostly regular with small shifts" },
      { id: "irregular", label: "Often irregular" },
      { id: "unsure", label: "I'm not sure yet" },
    ],
  },
  {
    id: "support",
    question: "What would you like the most support with?",
    helper: "Choose what feels most important right now.",
    options: [
      { id: "nutrition", label: "Fertility nutrition guidance" },
      { id: "tracking", label: "Understanding my cycle" },
      { id: "supplements", label: "Supplement support" },
      { id: "emotional", label: "Feeling calm and informed" },
    ],
  },
  {
    id: "supplements",
    question: "Are you currently taking fertility supplements?",
    helper: "We'll build a plan that fits where you are.",
    options: [
      { id: "yes", label: "Yes, a full routine" },
      { id: "some", label: "A few key ones" },
      { id: "no", label: "Not yet" },
      { id: "guidance", label: "I'd love guidance on this" },
    ],
  },
] as const;

export const symptoms = [
  "Headache", "Fatigue", "Cramps", "Nausea", "Bloating", "Acne", "Backache", "Tender breasts",
];

export const nutritionFocus = [
  {
    title: "Leafy greens",
    desc: "Folate-rich foods to support egg quality and early development.",
    tone: "lavender" as const,
  },
  {
    title: "Complex carbs",
    desc: "Steady energy and balanced blood sugar through your cycle.",
    tone: "blue" as const,
  },
  {
    title: "Omega-rich foods",
    desc: "Healthy fats to support hormone balance and inflammation.",
    tone: "pink" as const,
  },
  {
    title: "Zinc-rich foods",
    desc: "Trace minerals that support reproductive cell health.",
    tone: "lavender" as const,
  },
];

export const articles = [
  { title: "Eating for your luteal phase", read: "4 min read" },
  { title: "How hydration shapes fertility", read: "3 min read" },
  { title: "A gentle guide to supplements", read: "6 min read" },
];

export const profileMenu = {
  account: [
    { label: "Personal Details" },
    { label: "Health Profile" },
    { label: "Tracking Preferences" },
  ],
  about: [{ label: "Privacy & Data" }, { label: "Help & Support" }],
};

// 28-day cycle visualisation
export type CycleDay = { day: number; type: "period" | "follicular" | "fertile" | "ovulation" | "luteal" };
export const cycleDays: CycleDay[] = Array.from({ length: 28 }, (_, i) => {
  const d = i + 1;
  let type: CycleDay["type"] = "follicular";
  if (d <= 5) type = "period";
  else if (d >= 11 && d <= 16) type = "fertile";
  else if (d > 16) type = "luteal";
  if (d === 14) type = "ovulation";
  return { day: d, type };
});

export const insightBars = [82, 78, 90, 85, 88, 80, 92];
export const nutritionBars = [60, 75, 70, 85, 78, 90, 82];
