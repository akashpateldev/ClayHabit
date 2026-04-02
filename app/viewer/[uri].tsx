import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

const { width } = Dimensions.get("window");

export default function FileViewerScreen() {
  const { uri, courseName, fileName, fileType } = useLocalSearchParams<{
    uri: string;
    courseName: string;
    fileName: string;
    fileType: string;
  }>();

  const fileUri = decodeURIComponent(uri ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const isPdf = fileType === "pdf";
  const isImage = fileType === "image";

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Pressable
          onPress={() => { router.back(); Haptics.selectionAsync(); }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>{fileName}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{courseName}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{fileType?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={24} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isPdf && (
          <WebView
            source={{ uri: fileUri }}
            style={{ flex: 1, backgroundColor: Colors.bg }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError("Could not open PDF. Make sure the file exists.");
            }}
            startInLoadingState={false}
          />
        )}

        {isImage && (
          <ScrollView
            contentContainerStyle={styles.imageContainer}
            showsVerticalScrollIndicator={false}
            maximumZoomScale={4}
            minimumZoomScale={1}
          >
            <Image
              source={{ uri: fileUri }}
              style={styles.image}
              resizeMode="contain"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError("Could not load image.");
              }}
            />
          </ScrollView>
        )}

        {!isPdf && !isImage && (
          <View style={styles.unsupported}>
            <Feather name="file" size={48} color={Colors.textMuted} />
            <Text style={styles.unsupportedText}>
              This file type cannot be previewed
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

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
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.elevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
    zIndex: 10,
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  imageContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  image: {
    width: width - 32,
    height: (width - 32) * 0.75,
    maxHeight: 600,
  },
  unsupported: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  unsupportedText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
});
