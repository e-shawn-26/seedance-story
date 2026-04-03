"use client";

export type GenerationGuardState = {
  active: boolean;
  taskId?: string;
  prompt?: string;
  ratio?: "16:9" | "9:16" | "1:1";
  duration?: 5 | 10;
};

export const GENERATION_GUARD_STORAGE_KEY = "seedance-generation-state";
export const GENERATION_GUARD_EVENT = "seedance:generation-state-change";

const DEFAULT_STATE: GenerationGuardState = {
  active: false
};

export function readGenerationGuardState(): GenerationGuardState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  const raw = window.sessionStorage.getItem(GENERATION_GUARD_STORAGE_KEY);

  if (!raw) {
    return DEFAULT_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as GenerationGuardState;
    return parsed.active ? parsed : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function writeGenerationGuardState(state: GenerationGuardState) {
  if (typeof window === "undefined") {
    return;
  }

  if (state.active) {
    window.sessionStorage.setItem(GENERATION_GUARD_STORAGE_KEY, JSON.stringify(state));
  } else {
    window.sessionStorage.removeItem(GENERATION_GUARD_STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent(GENERATION_GUARD_EVENT, { detail: state }));
}
