import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CourseCard } from "@/components/CourseCard";
import { Colors } from "@/constants/colors";
import { useCourses } from "@/context/CourseContext";

export default function CoursesScreen() {
  const { courses, scanning, scanError, refresh, getCourseProgress } = useCourses();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

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
        <Text style={styles.title}>Courses</Text>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); refresh(); }}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="refresh-cw" size={18} color={Colors.accent} />
        </Pressable>
      </View>

      {scanning && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.scanText}>Scanning courses...</Text>
        </View>
      )}

      {scanError && (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={16} color={Colors.warning} />
          <Text style={styles.errorText}>{scanError}</Text>
        </View>
      )}

      {!scanning && courses.length === 0 && (
        <View style={styles.empty}>
          <Feather name="folder-plus" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No courses yet</Text>
          <Text style={styles.emptyText}>
            Add course folders to{"\n"}/storage/emulated/0/Courses
          </Text>
        </View>
      )}

      <FlatList
        data={courses}
        keyExtractor={(item) => item.name}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cp = getCourseProgress(item);
          return (
            <CourseCard
              course={item}
              completed={cp.completed}
              total={cp.total}
              percent={cp.percent}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: "/course/[name]",
                  params: { name: encodeURIComponent(item.name) },
                });
              }}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  scanText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 20,
    padding: 14,
    backgroundColor: "rgba(255,179,71,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,179,71,0.2)",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.warning,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  list: { paddingHorizontal: 20, paddingTop: 8 },
});
