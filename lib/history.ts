export type StoryRatio = "16:9" | "9:16" | "1:1";
export type StoryDuration = 5 | 10;

export type HistoryItem = {
  taskId: string;
  prompt: string;
  videoUrl: string;
  createdAt: number | string;
  ratio: StoryRatio;
  duration: StoryDuration;
};

export const HISTORY_STORAGE_KEY = "seedance-history";
const HISTORY_LIMIT = 20;

export function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
}

export function pushHistory(item: HistoryItem) {
  const nextItems = [
    item,
    ...readHistory().filter((entry) => entry.taskId !== item.taskId)
  ];
  saveHistory(nextItems);
  return nextItems.slice(0, HISTORY_LIMIT);
}

export function formatHistoryDate(value: number | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
