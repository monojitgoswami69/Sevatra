/**
 * Re-export shim — all severity logic now lives in utils/severityCalculator.ts
 * This file exists only for backward compatibility with existing imports.
 */
export {
  calculateSeverityScore,
  getSeverityColor,
  getSeverityTextColor,
  getConditionStyles,
  validateVitalSigns,
  getNormalRange,
  isVitalNormal,
  getUrgencyStyles,
  getConditionDotColor,
  getVitalDeviation,
  getSeverityTrend,
  getTrendDisplay,
  NORMAL_RANGES,
} from '../../utils/severityCalculator';

export type {
  VitalSigns,
  SeverityResult,
  SubScore,
  Condition,
  Ward,
  VitalKey,
  ValidationResult,
  NormalRange,
  Trend,
} from '../../utils/severityCalculator';

export { default } from '../../utils/severityCalculator';
