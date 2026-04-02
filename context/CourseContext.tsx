import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Course, scanCourses } from "@/lib/scanner";
import {
  LastOpened,
  ProgressMap,
  getDailyStats,
  getTodayKey,
  getLastOpened,
  getProgress,
  saveLastOpened,
  saveProgress,
  updateVideoProgress,
} from "@/lib/storage";

type CourseContextType = {
  courses: Course[];
  progress: ProgressMap;
  lastOpened: LastOpened | null;
  todayMinutes: number;
  scanning: boolean;
  scanError: string | null;
  refresh: () => Promise<void>;
  getCourseProgress: (course: Course) => { total: number; completed: number; percent: number };
  updateProgress: (
    fileUri: string,
    courseName: string,
    watched: number,
    duration: number
  ) => Promise<void>;
  setLastOpenedItem: (item: LastOpened) => Promise<void>;
  addWatchSeconds: (seconds: number) => void;
};

const CourseContext = createContext<CourseContextType | null>(null);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [lastOpened, setLastOpened] = useState<LastOpened | null>(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const watchSecondsRef = useRef(0);

  const refresh = useCallback(async () => {
    setScanning(true);
    setScanError(null);
    try {
      const [scanResult, prog, last, stats] = await Promise.all([
        scanCourses(),
        getProgress(),
        getLastOpened(),
        getDailyStats(),
      ]);
      if (scanResult.error) setScanError(scanResult.error);
      setCourses(scanResult.courses);
      setProgress(prog);
      setLastOpened(last);
      setTodayMinutes(Math.floor((stats[getTodayKey()] ?? 0) / 60));
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getCourseProgress = useCallback(
    (course: Course) => {
      const videos = course.files.filter((f) => f.type === "video");
      const total = videos.length;
      const completed = videos.filter((f) => progress[f.uri]?.completed).length;
      const percent = total > 0 ? (completed / total) * 100 : 0;
      return { total, completed, percent };
    },
    [progress]
  );

  const updateProgress = useCallback(
    async (fileUri: string, courseName: string, watched: number, duration: number) => {
      const updated = await updateVideoProgress(fileUri, courseName, watched, duration);
      setProgress((prev) => ({ ...prev, [fileUri]: updated }));
    },
    []
  );

  const setLastOpenedItem = useCallback(async (item: LastOpened) => {
    await saveLastOpened(item);
    setLastOpened(item);
  }, []);

  const addWatchSeconds = useCallback(async (seconds: number) => {
    watchSecondsRef.current += seconds;
    const today = getTodayKey();
    const stats = await getDailyStats();
    stats[today] = (stats[today] ?? 0) + seconds;
    await AsyncStorage.setItem("clayhabit_daily_stats_v1", JSON.stringify(stats));
    setTodayMinutes(Math.floor((stats[today] ?? 0) / 60));
  }, []);

  return (
    <CourseContext.Provider
      value={{
        courses,
        progress,
        lastOpened,
        todayMinutes,
        scanning,
        scanError,
        refresh,
        getCourseProgress,
        updateProgress,
        setLastOpenedItem,
        addWatchSeconds,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses(): CourseContextType {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourses must be used inside CourseProvider");
  return ctx;
}
