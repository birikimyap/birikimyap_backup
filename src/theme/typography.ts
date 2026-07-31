import { moderateScale } from "../utils/responsive";

export const typography = {
  display: {
    fontSize: moderateScale(34),
    lineHeight: moderateScale(40),
    fontWeight: "800" as const
  },
  title: {
    fontSize: moderateScale(24),
    lineHeight: moderateScale(30),
    fontWeight: "800" as const
  },
  subtitle: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(24),
    fontWeight: "700" as const
  },
  body: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(22),
    fontWeight: "500" as const
  },
  caption: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontWeight: "600" as const
  },
  tiny: {
    fontSize: moderateScale(11),
    lineHeight: moderateScale(14),
    fontWeight: "700" as const
  }
} as const;
