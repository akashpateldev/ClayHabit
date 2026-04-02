import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export const COURSES_ROOT =
  Platform.OS === "android"
    ? "file:///storage/emulated/0/Courses"
    : FileSystem.documentDirectory + "Courses";

export type CourseFile = {
  name: string;
  uri: string;
  type: "video" | "pdf" | "image" | "unknown";
  size?: number;
};

export type Course = {
  name: string;
  uri: string;
  files: CourseFile[];
};

function getFileType(name: string): CourseFile["type"] {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".mkv") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".webm")) {
    return "video";
  }
  if (lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp") || lower.endsWith(".gif")) {
    return "image";
  }
  return "unknown";
}

function isSupportedFile(name: string): boolean {
  const type = getFileType(name);
  return type !== "unknown";
}

export async function scanCourses(): Promise<{
  courses: Course[];
  error?: string;
}> {
  try {
    const info = await FileSystem.getInfoAsync(COURSES_ROOT);
    if (!info.exists) {
      return { courses: [], error: "Courses folder not found at " + COURSES_ROOT };
    }
    const entries = await FileSystem.readDirectoryAsync(COURSES_ROOT);
    const courses: Course[] = [];

    for (const entry of entries) {
      const entryUri = COURSES_ROOT + "/" + entry;
      const entryInfo = await FileSystem.getInfoAsync(entryUri);
      if (entryInfo.isDirectory) {
        const fileNames = await FileSystem.readDirectoryAsync(entryUri);
        const files: CourseFile[] = fileNames
          .filter(isSupportedFile)
          .sort()
          .map((fname) => ({
            name: fname,
            uri: entryUri + "/" + fname,
            type: getFileType(fname),
          }));
        if (files.length > 0) {
          courses.push({ name: entry, uri: entryUri, files });
        }
      }
    }

    return { courses: courses.sort((a, b) => a.name.localeCompare(b.name)) };
  } catch (err: unknown) {
    return {
      courses: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
