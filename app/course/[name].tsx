import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CircularProgress } from "@/components/CircularProgress";
import { FileItem } from "@/components/FileItem";
import { Colors } from "@/constants/colors";
import { useCourses } from "@/context/CourseContext";

export default function CourseDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const courseName = decodeURIComponent(name ?? "");
  const { courses, progress, getCourseProgress } = useCourses();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const course = courses.find((c) => c.name === courseName);

  if (!course) {
    return (
      <View style={[styles.root, { paddingTop: topPadding }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Course not found</Text>
        </View>
      </View>
    );
  }

  const cp = getCourseProgress(course);
  const videos = course.files.filter((f) => f.type === "video");
  const docs = course.files.filter((f) => f.type !== "video");

  const handleFilePress = (fileUri: string, fileType: string, fileName: string) => {
    Haptics.selectionAsync();
    if (fileType === "video") {
      router.push({
        pathname: "/player/[uri]",
        params: {
          uri: encodeURIComponent(fileUri),
          courseName: courseName,
          fileName: fileName,
          allFiles: JSON.stringify(
            videos.map((v) => ({ uri: v.uri, name: v.name }))
          ),
        },
      });
    } else {
      router.push({
        pathname: "/viewer/[uri]",
        params: {
          uri: encodeURIComponent(fileUri),
          courseName: courseName,
          fileName: fileName,
          fileType: fileType,
        },
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.courseName} numberOfLines={2}>{course.name}</Text>
        </View>
        <CircularProgress percent={cp.percent} size={52} strokeWidth={4} />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <StatItem icon="play" value={videos.length.toString()} label="Videos" />
        <StatItem icon="check-circle" value={cp.completed.toString()} label="Done" color={Colors.success} />
        <StatItem icon="file-text" value={docs.length.toString()} label="Docs" color={Colors.warning} />
        <StatItem icon="percent" value={Math.round(cp.percent).toString() + "%"} label="Progress" color={Colors.accent} />
      </View>

      {/* File List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24 }}
      >
        {videos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Videos</Text>
            <View style={styles.fileList}>
              {videos.map((file, idx) => (
                <FileItem
                  key={file.uri}
                  file={file}
                  index={idx}
                  progress={progress[file.uri]}
                  onPress={() => handleFilePress(file.uri, file.type, file.name)}
                />
              ))}
            </View>
          </View>
        )}

        {docs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materials</Text>
            <View style={styles.fileList}>
              {docs.map((file, idx) => (
                <FileItem
                  key={file.uri}
                  file={file}
                  index={idx}
                  progress={undefined}
                  onPress={() => handleFilePress(file.uri, file.type, file.name)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatItem({
  icon,
  value,
  label,
  color = Colors.textSecondary,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={statStyles.item}>
      <Feather name={icon} size={14} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { flex: 1, alignItems: "center", gap: 3 },
  value: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  courseName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    lineHeight: 28,
  },
  statsBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
  },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingBottom: 8,
    marginTop: 12,
  },
  fileList: {
    marginHorizontal: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
});
