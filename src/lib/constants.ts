// Shared product constants — single source (previously declared in 4 files).

/** Daily hydration goal in ml. */
export const WATER_TARGET_ML = 2400;
/** Hydration stepper increment in ml. */
export const WATER_STEP_ML = 200;
/** Hard cap for a single day's water in ml (matches server validation). */
export const WATER_MAX_ML = 10000;

/**
 * The supplement checklist. Unified across Log + Nutrition (previously the Log
 * dialog tracked "Folic acid/Vitamin D/Iron/Omega-3" while the Nutrition plan
 * advertised Folate/Omega-3/Vitamin D/Zinc). Logs saved under the old names
 * still display in history; they just won't pre-check the new list.
 */
export const SUPPLEMENTS = ["Folate", "Omega-3", "Vitamin D", "Zinc"] as const;
