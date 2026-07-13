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
    fact: {
      title: "Did you know?",
      body: "Only about 13% of cycles are exactly 28 days. A healthy cycle can range from 21 to 35 days — your rhythm is uniquely yours, and tracking it reveals your most fertile window.",
    },
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
] as const;

export const symptoms = [
  "Headache", "Fatigue", "Cramps", "Nausea", "Bloating", "Acne", "Backache", "Tender breasts",
];

export const articles = [
  { title: "Eating for your luteal phase", read: "4 min read" },
  { title: "How hydration shapes fertility", read: "3 min read" },
  { title: "A gentle guide to supplements", read: "6 min read" },
];
