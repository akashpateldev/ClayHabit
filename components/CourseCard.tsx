import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { CircularProgress } from "@/components/CircularProgress";
import { Course } from "@/lib/scanner";

type CourseCardProps = {
  course: Course;
  completed: number;
  total: number;
  percent: number;
  onPress: () => void;
};

export function CourseCard({
  course,
  completed,
  total,
  percent,
  onPress,
}: CourseCardProps) {
  const fileCount = course.files.length;
  const videoCount = course.files.filter((f) => f.type === "video").length;
  const pdfCount = course.files.filter((f) => f.type === "pdf").length;
  const imgCount = course.files.filter((f) => f.type === "image").length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <Text style={styles.courseName} numberOfLines={2}>
            {course.name}
          </Text>
          <View style={styles.tags}>
            {videoCount > 0 && (
              <View style={styles.tag}>
                <Feather name="play" size={10} color={Colors.accent} />
                <Text style={styles.tagText}>{videoCount}</Text>
              </View>
            )}
            {pdfCount > 0 && (
              <View style={[styles.tag, styles.tagPdf]}>
                <Feather name="file-text" size={10} color={Colors.warning} />
                <Text style={[styles.tagText, { color: Colors.warning }]}>{pdfCount}</Text>
              </View>
            )}
            {imgCount > 0 && (
              <View style={[styles.tag, styles.tagImg]}>
                <Feather name="image" size={10} color={Colors.accentLight} />
                <Text style={[styles.tagText, { color: Colors.accentLight }]}>{imgCount}</Text>
              </View>
            )}
          </View>
        </View>
        <CircularProgress percent={percent} size={60} strokeWidth={5} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.progressText}>
          {completed} of {total} completed
        </Text>
        {percent === 100 && (
          <View style={styles.completeBadge}>
            <Feather name="check" size={10} color={Colors.success} />
            <Text style={styles.completeText}>Done</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 14,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleSection: { flex: 1, gap: 8 },
  courseName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    lineHeight: 22,
  },
  tags: { flexDirection: "row", gap: 6 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(124,111,255,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.2)",
  },
  tagPdf: {
    backgroundColor: "rgba(255,179,71,0.1)",
    borderColor: "rgba(255,179,71,0.2)",
  },
  tagImg: {
    backgroundColor: "rgba(160,150,255,0.1)",
    borderColor: "rgba(160,150,255,0.2)",
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(78,205,196,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(78,205,196,0.25)",
  },
  completeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.success,
  },
});
