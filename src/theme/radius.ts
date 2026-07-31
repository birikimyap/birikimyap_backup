import { moderateScale } from "../utils/responsive";

export const radius = {
  sm: moderateScale(10),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  pill: 999
} as const;
