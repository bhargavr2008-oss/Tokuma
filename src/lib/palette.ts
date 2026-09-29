// Categorical palette, validated with the dataviz validator against the bone
// chart surface #F4F2EA in light mode: lightness band, chroma floor, adjacent
// and all-pairs CVD separation and the normal-vision floor all pass at four
// slots. Ochre carries a contrast WARN (2.91:1), which is why every chart that
// uses it also ships a legend, direct labels or a table view.
// Assign in fixed order, never cycled. A 5th series folds into "Other".
export const CAT = ['#3F7A32', '#1F6E9C', '#C2811A', '#9B3B6E'] as const;

export const STATUS = {
  good: '#3F7A32',
  warning: '#C2811A',
  serious: '#B4603A',
  critical: '#95492A',
};

// Single-hue sequential ramp for magnitude encodings.
export const SEQ = ['#DDE4D4', '#B8C7A8', '#8FA67B', '#638A52', '#3F7A32'];

export const SURFACE = '#F4F2EA';
export const GRID = 'rgba(22,33,24,0.10)';
export const INK = { primary: '#162118', secondary: '#4C5A4E', muted: '#7C8878' };
