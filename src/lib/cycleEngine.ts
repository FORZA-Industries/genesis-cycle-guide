// Cycle engine facade — exposes phase copy + focus helpers consumed by Home.
// Underlying math + data lives in '@/lib/cycle'.
import {
  getCyclePhase,
  phaseHeroCopy,
  phaseLabel,
  type CyclePhaseInfo,
  type Phase,
} from "@/lib/cycle";

export { getCyclePhase };
export type { CyclePhaseInfo, Phase };

export function getPhaseSubLabel(phase: Phase, fertileWindow: boolean): string {
  if (fertileWindow) return "Fertile window";
  return phaseLabel[phase];
}

export function getPhaseHeroText(phase: Phase, fertileWindow: boolean): string {
  if (fertileWindow && phase !== "ovulatory") return "Fertile window is open";
  return phaseHeroCopy[phase].hero;
}

export function getPhaseHeroSubtext(phase: Phase, fertileWindow: boolean): string {
  if (fertileWindow && phase !== "ovulatory") {
    return "Conception chances are rising — stay hydrated and prioritise rest.";
  }
  return phaseHeroCopy[phase].sub;
}

export function getPhaseTags(phase: Phase, fertileWindow: boolean): string[] {
  const base = phaseHeroCopy[phase].tags;
  if (fertileWindow && phase !== "ovulatory") return ["Fertile window", ...base];
  return base;
}

export function getTodaysFocus(phase: Phase): { title: string; description: string } {
  const f = phaseHeroCopy[phase].focus;
  return { title: f.title, description: f.body };
}
