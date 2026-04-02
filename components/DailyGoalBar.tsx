import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";

const DAILY_GOAL_MINUTES = 20;

type DailyGoalBarProps = {
  minutes: number;
};

export function DailyGoalBar({ minutes }: DailyGoalBarProps) {
  const progress = Math.min(minutes / DAILY_GOAL_MINUTES, 1);
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, width]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  const isComplete = minutes >= DAILY_GOAL_MINUTES;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Daily Goal</Text>
        <Text style={[styles.value, isComplete && styles.complete]}>
          {minutes}m / {DAILY_GOAL_MINUTES}m
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            animStyle,
            { backgroundColor: isComplete ? Colors.success : Colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  complete: { color: Colors.success },
  track: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
