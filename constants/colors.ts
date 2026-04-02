const CLAY_BG = "#0D0D14";
const CLAY_SURFACE = "#15151F";
const CLAY_CARD = "#1C1C2A";
const CLAY_ELEVATED = "#242433";
const CLAY_ACCENT = "#7C6FFF";
const CLAY_ACCENT_LIGHT = "#A096FF";
const CLAY_SUCCESS = "#4ECDC4";
const CLAY_WARNING = "#FFB347";
const CLAY_ERROR = "#FF6B6B";
const CLAY_TEXT = "#EEEEFF";
const CLAY_TEXT_SECONDARY = "#8888AA";
const CLAY_TEXT_MUTED = "#555577";
const CLAY_BORDER = "#2A2A3E";
const CLAY_SHADOW_DARK = "#09090F";
const CLAY_SHADOW_LIGHT = "#1F1F2E";

export const Colors = {
  bg: CLAY_BG,
  surface: CLAY_SURFACE,
  card: CLAY_CARD,
  elevated: CLAY_ELEVATED,
  accent: CLAY_ACCENT,
  accentLight: CLAY_ACCENT_LIGHT,
  success: CLAY_SUCCESS,
  warning: CLAY_WARNING,
  error: CLAY_ERROR,
  text: CLAY_TEXT,
  textSecondary: CLAY_TEXT_SECONDARY,
  textMuted: CLAY_TEXT_MUTED,
  border: CLAY_BORDER,
  shadowDark: CLAY_SHADOW_DARK,
  shadowLight: CLAY_SHADOW_LIGHT,
};

export const clay = {
  card: {
    backgroundColor: CLAY_CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CLAY_BORDER,
    shadowColor: CLAY_SHADOW_DARK,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  elevated: {
    backgroundColor: CLAY_ELEVATED,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: CLAY_SHADOW_DARK,
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  button: {
    backgroundColor: CLAY_ACCENT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(180, 160, 255, 0.3)",
    shadowColor: CLAY_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};

export default Colors;
