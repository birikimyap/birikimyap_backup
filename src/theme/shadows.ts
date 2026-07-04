import { colors } from "./colors";

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 4
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 5
  }
} as const;
