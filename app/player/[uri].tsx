import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useCourses } from "@/context/CourseContext";

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

type ZoomMode = "fit" | "fill";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayerScreen() {
  const { uri, courseName, fileName, allFiles } = useLocalSearchParams<{
    uri: string;
    courseName: string;
    fileName: string;
    allFiles?: string;
  }>();

  const fileUri = decodeURIComponent(uri ?? "");
  const courseNameStr = courseName ?? "";
  const fileNameStr = fileName ?? "";

  const videoRef = useRef<Video>(null);
  const { progress, updateProgress, setLastOpenedItem, addWatchSeconds } = useCourses();
  const insets = useSafeAreaInsets();

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [didComplete, setDidComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit");
  const [screenDims, setScreenDims] = useState(Dimensions.get("window"));

  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchStart = useRef<number>(0);
  const controlTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekBarWidth = useRef(Dimensions.get("window").width - 40);
  const currentPos = useRef(0);
  const currentDur = useRef(0);

  const allFilesArr: { uri: string; name: string }[] = allFiles
    ? JSON.parse(allFiles)
    : [];
  const currentIndex = allFilesArr.findIndex((f) => f.uri === fileUri);
  const savedProgress = progress[fileUri];

  const progressShared = useSharedValue(0);

  // Track screen dimensions on orientation change
  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDims(window);
      seekBarWidth.current = window.width - 40;
    });
    return () => sub.remove();
  }, []);

  // Cleanup: restore portrait and clear timers on unmount
  useEffect(() => {
    return () => {
      if (saveInterval.current) clearInterval(saveInterval.current);
      if (controlTimeout.current) clearTimeout(controlTimeout.current);
      if (Platform.OS !== "web") {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        ).catch(() => {});
      }
    };
  }, []);

  const autoHideControls = useCallback(() => {
    if (controlTimeout.current) clearTimeout(controlTimeout.current);
    controlTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const onLoad = useCallback(
    async (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      const dur = (status.durationMillis ?? 0) / 1000;
      currentDur.current = dur;
      setDuration(dur);

      const restorePos = savedProgress?.watched ?? 0;
      if (restorePos > 5 && restorePos < dur - 5) {
        await videoRef.current?.setPositionAsync(restorePos * 1000);
        setPosition(restorePos);
        currentPos.current = restorePos;
        progressShared.value = restorePos / dur;
      }

      await videoRef.current?.playAsync();
      setIsPlaying(true);
      watchStart.current = Date.now();
      autoHideControls();

      saveInterval.current = setInterval(async () => {
        const pos = currentPos.current;
        const d = currentDur.current;
        await updateProgress(fileUri, courseNameStr, pos, d);
        await setLastOpenedItem({
          fileUri,
          courseName: courseNameStr,
          fileName: fileNameStr,
          timestamp: Date.now(),
          remaining: Math.max(0, d - pos),
        });
        if (watchStart.current > 0) {
          const elapsed = (Date.now() - watchStart.current) / 1000;
          addWatchSeconds(elapsed);
          watchStart.current = Date.now();
        }
      }, 3000);
    },
    [
      savedProgress,
      fileUri,
      courseNameStr,
      fileNameStr,
      updateProgress,
      setLastOpenedItem,
      addWatchSeconds,
      autoHideControls,
      progressShared,
    ]
  );

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      const pos = (status.positionMillis ?? 0) / 1000;
      const dur = (status.durationMillis ?? 0) / 1000;
      currentPos.current = pos;
      currentDur.current = dur;
      setPosition(pos);
      setIsPlaying(status.isPlaying);
      if (dur > 0) progressShared.value = withTiming(pos / dur, { duration: 200 });
      if (status.didJustFinish && !didComplete) {
        setDidComplete(true);
        setShowControls(true);
        updateProgress(fileUri, courseNameStr, dur, dur);
        if (watchStart.current > 0) {
          addWatchSeconds((Date.now() - watchStart.current) / 1000);
          watchStart.current = 0;
        }
      }
    },
    [fileUri, courseNameStr, didComplete, updateProgress, progressShared, addWatchSeconds]
  );

  const togglePlay = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      if (watchStart.current > 0) {
        addWatchSeconds((Date.now() - watchStart.current) / 1000);
        watchStart.current = 0;
      }
    } else {
      await videoRef.current?.playAsync();
      watchStart.current = Date.now();
      autoHideControls();
    }
  }, [isPlaying, addWatchSeconds, autoHideControls]);

  const seekRelative = useCallback(
    async (delta: number) => {
      const newPos = Math.max(0, Math.min(currentDur.current, currentPos.current + delta));
      await videoRef.current?.setPositionAsync(newPos * 1000);
      setPosition(newPos);
      currentPos.current = newPos;
      if (currentDur.current > 0)
        progressShared.value = newPos / currentDur.current;
      Haptics.selectionAsync();
    },
    [progressShared]
  );

  const handleSeek = useCallback(
    async (xPercent: number) => {
      if (currentDur.current <= 0) return;
      const newPos = xPercent * currentDur.current;
      await videoRef.current?.setPositionAsync(newPos * 1000);
      setPosition(newPos);
      currentPos.current = newPos;
      progressShared.value = xPercent;
    },
    [progressShared]
  );

  const setPlaybackSpeed = useCallback(async (s: number) => {
    setSpeed(s);
    setSpeedMenuOpen(false);
    await videoRef.current?.setRateAsync(s, true);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (Platform.OS === "web") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isFullscreen) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      setIsFullscreen(true);
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const toggleZoom = useCallback(() => {
    Haptics.selectionAsync();
    setZoomMode((prev) => (prev === "fit" ? "fill" : "fit"));
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < allFilesArr.length - 1) {
      const next = allFilesArr[currentIndex + 1];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.replace({
        pathname: "/player/[uri]",
        params: {
          uri: encodeURIComponent(next.uri),
          courseName: courseNameStr,
          fileName: next.name,
          allFiles: JSON.stringify(allFilesArr),
        },
      });
    }
  }, [currentIndex, allFilesArr, courseNameStr]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressShared.value * 100}%`,
  }));

  const topPadding = isFullscreen ? 8 : Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = isFullscreen ? 8 : insets.bottom + 12;
  const sidePadding = isFullscreen ? Math.max(insets.left, insets.right, 20) : 20;

  const resizeMode = zoomMode === "fill" ? ResizeMode.COVER : ResizeMode.CONTAIN;

  return (
    <View style={styles.root}>
      <StatusBar hidden={isFullscreen} style="light" />

      {/* Tap area — toggles controls */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          setShowControls((v) => !v);
          if (!showControls) autoHideControls();
          // Close speed menu if open
          if (speedMenuOpen) setSpeedMenuOpen(false);
        }}
      >
        <Video
          ref={videoRef}
          source={{ uri: fileUri }}
          style={{ flex: 1 }}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay={false}
          useNativeControls={false}
        />

        {/* Controls Overlay */}
        {showControls && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(180)}
            style={styles.overlay}
          >
            {/* ── TOP BAR ── */}
            <View style={[styles.topBar, { paddingTop: topPadding, paddingHorizontal: sidePadding }]}>
              {/* Back / close */}
              <Pressable
                onPress={() => {
                  router.back();
                  Haptics.selectionAsync();
                }}
                style={styles.iconBtn}
              >
                <Ionicons name="chevron-down" size={24} color="#fff" />
              </Pressable>

              {/* Title */}
              <View style={styles.titleBlock}>
                <Text style={styles.courseLabel} numberOfLines={1}>
                  {courseNameStr}
                </Text>
                <Text style={styles.fileLabel} numberOfLines={1}>
                  {fileNameStr}
                </Text>
              </View>

              {/* Top-right controls: zoom · speed · fullscreen */}
              <View style={styles.topRight}>
                {/* Zoom toggle */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleZoom();
                  }}
                  style={styles.iconBtn}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name={zoomMode === "fit" ? "fit-to-screen" : "crop-free"}
                    size={22}
                    color={zoomMode === "fill" ? Colors.accent : "#fff"}
                  />
                </Pressable>

                {/* Speed */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setSpeedMenuOpen((v) => !v);
                    Haptics.selectionAsync();
                  }}
                  style={styles.speedBtn}
                  hitSlop={8}
                >
                  <Text style={styles.speedText}>{speed}×</Text>
                </Pressable>

                {/* Fullscreen (Android/iOS only) */}
                {Platform.OS !== "web" && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleFullscreen();
                    }}
                    style={styles.iconBtn}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={isFullscreen ? "contract" : "expand"}
                      size={22}
                      color="#fff"
                    />
                  </Pressable>
                )}
              </View>
            </View>

            {/* ── CENTER CONTROLS ── */}
            <View style={styles.centerRow}>
              <Pressable onPress={() => seekRelative(-10)} style={styles.seekBtn}>
                <Ionicons name="play-back" size={28} color="#fff" />
                <Text style={styles.seekLabel}>10</Text>
              </Pressable>

              <Pressable onPress={togglePlay} style={styles.playBtn}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={36}
                  color="#fff"
                  style={!isPlaying ? { marginLeft: 4 } : undefined}
                />
              </Pressable>

              <Pressable onPress={() => seekRelative(10)} style={styles.seekBtn}>
                <Ionicons name="play-forward" size={28} color="#fff" />
                <Text style={styles.seekLabel}>10</Text>
              </Pressable>
            </View>

            {/* ── BOTTOM BAR ── */}
            <View style={[styles.bottomBar, { paddingBottom: bottomPadding, paddingHorizontal: sidePadding }]}>
              {/* Time row */}
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Seek bar */}
              <Pressable
                onLayout={(e) => {
                  seekBarWidth.current = e.nativeEvent.layout.width;
                }}
                onPress={(e) => {
                  const x = e.nativeEvent.locationX;
                  handleSeek(Math.max(0, Math.min(1, x / seekBarWidth.current)));
                }}
                style={styles.seekBarTrack}
                hitSlop={{ top: 12, bottom: 12 }}
              >
                <Animated.View style={[styles.seekBarFill, progressBarStyle]} />
                <Animated.View
                  style={[
                    styles.seekBarThumb,
                    {
                      left:
                        duration > 0
                          ? Math.max(0, (position / duration) * (seekBarWidth.current - 16))
                          : 0,
                    },
                  ]}
                />
              </Pressable>

              {/* Bottom actions */}
              <View style={styles.bottomActions}>
                <Text style={styles.remainingText}>
                  {duration > position
                    ? `${formatTime(duration - position)} left`
                    : "Complete"}
                </Text>

                <View style={styles.bottomRight}>
                  {currentIndex >= 0 && currentIndex < allFilesArr.length - 1 && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        goNext();
                      }}
                      style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={styles.nextBtnText}>Next</Text>
                      <Ionicons name="play-skip-forward" size={14} color={Colors.accent} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </Pressable>

      {/* Speed menu — rendered outside the tap-area Pressable to avoid propagation issues */}
      {speedMenuOpen && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={[styles.speedMenu, { top: topPadding + 52 }]}
          pointerEvents="box-none"
        >
          {SPEEDS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setPlaybackSpeed(s)}
              style={[styles.speedOption, s === speed && styles.speedOptionActive]}
            >
              <Text
                style={[
                  styles.speedOptionText,
                  s === speed && styles.speedOptionActiveText,
                ]}
              >
                {s}×
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Completion banner */}
      {didComplete && (
        <View style={[styles.completeBanner, { bottom: insets.bottom + 20 }]}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.completeText}>Lecture Complete!</Text>
          {currentIndex >= 0 && currentIndex < allFilesArr.length - 1 && (
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [styles.nextBtnBig, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.nextBtnBigText}>Next Lecture</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
    justifyContent: "space-between",
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    gap: 8,
  },
  titleBlock: { flex: 1 },
  courseLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },
  fileLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    marginTop: 2,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
  },
  speedBtn: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "rgba(124,111,255,0.28)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.5)",
    minWidth: 42,
    alignItems: "center",
  },
  speedText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },

  /* Center controls */
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 44,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 14,
  },
  seekBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    position: "relative",
  },
  seekLabel: {
    position: "absolute",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.9)",
    bottom: 2,
  },

  /* Bottom bar */
  bottomBar: { gap: 8 },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  seekBarTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    position: "relative",
  },
  seekBarFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  seekBarThumb: {
    position: "absolute",
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  remainingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(124,111,255,0.2)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(124,111,255,0.3)",
  },
  nextBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },

  /* Speed menu */
  speedMenu: {
    position: "absolute",
    right: 20,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    zIndex: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 20,
  },
  speedOption: {
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  speedOptionActive: { backgroundColor: "rgba(124,111,255,0.15)" },
  speedOptionText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  speedOptionActiveText: {
    color: Colors.accent,
    fontFamily: "Inter_700Bold",
  },

  /* Completion banner */
  completeBanner: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(78,205,196,0.3)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  completeText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.success,
  },
  nextBtnBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  nextBtnBigText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
