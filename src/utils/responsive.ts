import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// iPhone 14 / Pro - 390x844 as the base guideline
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

/**
 * Scales a dimension relative to screen width.
 * Useful for padding, margin, and border radius.
 */
export const scale = (size: number) => (width / guidelineBaseWidth) * size;

/**
 * Scales a dimension relative to screen height.
 * Useful for vertical spacing or heights.
 */
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

/**
 * Scales a dimension but applies a factor to prevent it from getting too small or too large.
 * Factor of 0.5 means it scales by half of the strict mathematical ratio, keeping things closer to original.
 * Useful for fonts and layout elements that shouldn't shrink aggressively.
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Convenience export for screen dimensions
 */
export const screenWidth = width;
export const screenHeight = height;
