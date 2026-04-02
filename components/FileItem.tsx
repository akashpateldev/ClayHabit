import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/colors";
import { CourseFile } from "@/lib/scanner";
import { VideoProgress } from "@/lib/storage";

type FileItemProps = {
  file: CourseFile;
  index: number;
  progress?: VideoProgress;
  onPress: () => void;
};

export function FileItem({ file, index, progress, onPress }: FileItemProps) {
  const isVideo = file.type === "video";
  const isPdf = file.type === "pdf";
  const isImage = file.type === "image";
  const isCompleted = progress?.completed;
  const watchPercent =
    isVideo && progress && progress.duration > 0
      ? (progress.watched / progress.duration) * 100
      : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, isCompleted && styles.iconBoxCompleted]}>
        {isVideo && (
          <Feather
            name="play"
            size={18}
            color={isCompleted ? Colors.success : Colors.accent}
          />
        )}
        {isPdf && (
          <MaterialCommunityIcons name="file-pdf-box" size={18} color={Colors.warning} />
        )}
        {isImage && (
          <Feather name="image" size={18} color={Colors.accentLight} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {file.name}
        </Text>
        {isVideo && progress && (
          <Text style={styles.sub}>
            {progress.completed
              ? "Completed"
              : progress.watched > 5
              ? `${formatTime(progress.watched)} watched`
              : "Not started"}
          </Text>
        )}
        {!isVideo && <Text style={styles.sub}>{isPdf ? "PDF" : "Image"}</Text>}
      </View>

      {isVideo && progress && !isCompleted && watchPercent > 0 && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(watchPercent, 100)}%` as `${number}%` },
            ]}
          />
        </View>
      )}

      {isCompleted && (
        <Feather name="check-circle" size={20} color={Colors.success} />
      )}

      {!isCompleted && (
        <Feather name="chevron-right" size={18} color={Colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  pressed: { opacity: 0.7, backgroundColor: Colors.elevated },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(124,111,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.2)",
  },
  iconBoxCompleted: {
    backgroundColor: "rgba(78,205,196,0.1)",
    borderColor: "rgba(78,205,196,0.25)",
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    lineHeight: 20,
  },
  sub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 68,
    right: 16,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
  },
});
