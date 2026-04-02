import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  PROGRESS: "clayhabit_progress_v1",
  LAST_OPENED: "clayhabit_last_opened_v1",
  DAILY_STATS: "clayhabit_daily_stats_v1",
} as const;

export type VideoProgress = {
  fileUri: string;
  courseName: string;
  duration: number;
  watched: number;
  completed: boolean;
  lastPlayed: number;
};

export type LastOpened = {
  courseName: string;
  fileName: string;
  fileUri: string;
  timestamp: number;
  remaining: number;
};

export type DailyStats = {
  [dateKey: string]: number;
};

export type ProgressMap = {
  [fileUri: string]: VideoProgress;
};

export async function getProgress(): Promise<ProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveProgress(progress: ProgressMap): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
  } catch {}
}

export async function updateVideoProgress(
  fileUri: string,
  courseName: string,
  watched: number,
  duration: number
): Promise<VideoProgress> {
  const all = await getProgress();
  const existing = all[fileUri];
  const completed = duration > 0 && watched / duration >= 0.9;
  const updated: VideoProgress = {
    fileUri,
    courseName,
    duration,
    watched,
    completed,
    lastPlayed: Date.now(),
  };
  all[fileUri] = updated;
  await saveProgress(all);
  return updated;
}

export async function getLastOpened(): Promise<LastOpened | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAST_OPENED);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveLastOpened(item: LastOpened): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_OPENED, JSON.stringify(item));
  } catch {}
}

export async function getDailyStats(): Promise<DailyStats> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DAILY_STATS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function addWatchTime(seconds: number): Promise<void> {
  const stats = await getDailyStats();
  const today = getTodayKey();
  stats[today] = (stats[today] ?? 0) + seconds;
  await AsyncStorage.setItem(KEYS.DAILY_STATS, JSON.stringify(stats));
}

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getTodayWatchMinutes(): Promise<number> {
  const stats = await getDailyStats();
  const today = getTodayKey();
  return Math.floor((stats[today] ?? 0) / 60);
}
