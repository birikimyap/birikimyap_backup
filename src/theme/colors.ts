export const lightColors = {
  background: "#F6F8F6",
  surface: "#FFFFFF",
  surfaceMuted: "#EBF0EC",
  primary: "#0D3228",
  primarySoft: "#E3ECE6",
  primaryMuted: "#5C7369",
  accent: "#B98E4B",
  accentSoft: "#F3EAE0",
  text: "#0C1411",
  textMuted: "#66736E",
  border: "rgba(13, 50, 40, 0.06)",
  danger: "#D32F2F",
  white: "#FFFFFF",
  shadow: "#0D1A15"
} as const;

export const darkColors = {
  background: "#050B08",
  surface: "#0C1310",
  surfaceMuted: "#13201B",
  primary: "#00E58F",
  primarySoft: "rgba(0, 229, 143, 0.08)",
  primaryMuted: "#7D8C86",
  accent: "#FFD700",
  accentSoft: "rgba(255, 215, 0, 0.08)",
  text: "#F5FBF8",
  textMuted: "#7C8C85",
  border: "rgba(0, 229, 143, 0.08)",
  danger: "#E53935",
  white: "#FFFFFF",
  shadow: "#000000"
} as const;

export const colors = lightColors;
