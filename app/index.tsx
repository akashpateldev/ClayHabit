import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClayCard } from "@/components/ClayCard";
import { DailyGoalBar } from "@/components/DailyGoalBar";
import { Colors } from "@/constants/colors";
import { useCourses } from "@/context/CourseContext";
import { scheduleDailyReminder } from "@/lib/notifications";

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "Complete";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 60) return `${Math.floor(m / 60)}h ${m % 60}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

export default function HomeScreen() {
  const { courses, lastOpened, todayMinutes, scanning, scanError, refresh, getCourseProgress } =
    useCourses();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    scheduleDailyReminder();
  }, []);

  const handleResume = useCallback(() => {
    if (!lastOpened) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/player/[uri]",
      params: {
        uri: encodeURIComponent(lastOpened.fileUri),
        courseName: lastOpened.courseName,
        fileName: lastOpened.fileName,
      },
    });
  }, [lastOpened]);

  const hasResume = !!lastOpened;
  const resumeCourse = hasResume
    ? courses.find((c) => c.name === lastOpened.courseName)
    : null;
  const resumeProgress = resumeCourse ? getCourseProgress(resumeCourse) : null;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPadding + 16, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={scanning}
            onRefresh={refresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good learning</Text>
            <Text style={styles.subtitle}>Keep building your knowledge</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); router.push("/courses"); }}
            style={styles.allCoursesBtn}
          >
            <Feather name="grid" size={20} color={Colors.accent} />
          </Pressable>
        </Animated.View>

        {/* Daily Goal */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <ClayCard style={styles.goalCard}>
            <DailyGoalBar minutes={todayMinutes} />
          </ClayCard>
        </Animated.View>

        {/* Loading */}
        {scanning && !hasResume && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.scanningText}>Scanning courses...</Text>
          </View>
        )}

        {/* Scan Error */}
        {scanError && (
          <Animated.View entering={FadeInDown.delay(80)}>
            <ClayCard style={styles.errorCard}>
              <View style={styles.errorRow}>
                <Feather name="alert-triangle" size={18} color={Colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>Could not scan courses</Text>
                  <Text style={styles.errorMsg}>{scanError}</Text>
                  <Text style={styles.errorHint}>
                    Place course folders at: /storage/emulated/0/Courses
                  </Text>
                </View>
              </View>
            </ClayCard>
          </Animated.View>
        )}

        {/* Resume Card */}
        {hasResume && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
            <Pressable
              onPress={handleResume}
              style={({ pressed }) => [styles.resumeWrapper, pressed && styles.pressed]}
            >
              <LinearGradient
                colors={["#1D1B2E", "#15152A", "#0D0D14"]}
                style={styles.resumeCard}
              >
                <View style={styles.resumeInner}>
                  <View style={styles.resumePlayBtn}>
                    <Feather name="play" size={28} color="#fff" />
                  </View>

                  <View style={styles.resumeInfo}>
                    <Text style={styles.resumeCourse} numberOfLines={1}>
                      {lastOpened.courseName}
                    </Text>
                    <Text style={styles.resumeFile} numberOfLines={2}>
                      {lastOpened.fileName}
                    </Text>
                    <View style={styles.resumeMeta}>
                      {lastOpened.remaining > 0 && (
                        <View style={styles.timeBadge}>
                          <Feather name="clock" size={11} color={Colors.accent} />
                          <Text style={styles.timeBadgeText}>
                            {formatRemaining(lastOpened.remaining)}
                          </Text>
                        </View>
                      )}
                      {resumeProgress && (
                        <Text style={styles.progressText}>
                          {Math.round(resumeProgress.percent)}% done
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* progress bar */}
                {resumeProgress && (
                  <View style={styles.resumeProgressTrack}>
                    <View
                      style={[
                        styles.resumeProgressFill,
                        { width: `${Math.min(resumeProgress.percent, 100)}%` as `${number}%` },
                      ]}
                    />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Courses Grid */}
        {!hasResume && !scanning && courses.length === 0 && !scanError && (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <Feather name="folder" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptyText}>
              Add course folders to {"\n"}/storage/emulated/0/Courses
            </Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
            >
              <Feather name="refresh-cw" size={14} color={Colors.accent} />
              <Text style={styles.retryText}>Scan again</Text>
            </Pressable>
          </Animated.View>
        )}

        {courses.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {hasResume ? "Your Courses" : "All Courses"}
              </Text>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.push("/courses"); }}
              >
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.coursesList}>
              {courses.slice(0, 4).map((course) => {
                const cp = getCourseProgress(course);
                return (
                  <Pressable
                    key={course.name}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push({
                        pathname: "/course/[name]",
                        params: { name: encodeURIComponent(course.name) },
                      });
                    }}
                    style={({ pressed }) => [styles.miniCard, pressed && styles.pressed]}
                  >
                    <View style={styles.miniCardIcon}>
                      <Feather name="book-open" size={18} color={Colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniCardName} numberOfLines={1}>
                        {course.name}
                      </Text>
                      <Text style={styles.miniCardSub}>
                        {cp.completed}/{cp.total} videos · {Math.round(cp.percent)}%
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={Colors.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  allCoursesBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalCard: { padding: 18 },
  centered: { alignItems: "center", gap: 12, paddingVertical: 40 },
  scanningText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  errorCard: {
    padding: 16,
    borderColor: "rgba(255,179,71,0.25)",
    backgroundColor: "rgba(255,179,71,0.08)",
  },
  errorRow: { flexDirection: "row", gap: 12 },
  errorTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.warning,
    marginBottom: 4,
  },
  errorMsg: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  errorHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.accent,
  },
  resumeWrapper: { borderRadius: 20, overflow: "hidden" },
  pressed: { opacity: 0.88 },
  resumeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.2)",
    overflow: "hidden",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  resumeInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  resumePlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  resumeInfo: { flex: 1, gap: 4 },
  resumeCourse: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  resumeFile: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    lineHeight: 22,
  },
  resumeMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(124,111,255,0.15)",
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.accent,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  resumeProgressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    marginHorizontal: 0,
  },
  resumeProgressFill: {
    height: 3,
    backgroundColor: Colors.accent,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.accent,
  },
  coursesList: { gap: 10 },
  miniCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  miniCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(124,111,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniCardName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  miniCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
