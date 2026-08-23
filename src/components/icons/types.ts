import React from 'react';

/**
 * Bileo Bespoke SVG Icon Properties
 * Uniform contract for all UI, travel, booking, utility, amenity, and transport modality icons.
 */
export interface BileoIconProps extends React.SVGAttributes<SVGSVGElement> {
  /** Size in pixels (number) or CSS dimension string (e.g. '1.5rem', '24px') */
  size?: number | string;
  /** Stroke width in pixels (defaults to 1.75 for general UI icons, 1.8 for transport icons, 2.0/2.8 for checkmarks) */
  strokeWidth?: number | string;
  /** Custom CSS class names (e.g. Tailwind sizing & color utility classes) */
  className?: string;
  /** Custom stroke color (defaults to 'currentColor' if unspecified) */
  color?: string;
  /** Accessible title for screen readers and tooltips (injects `<title>` element when provided) */
  title?: string;
}

/** Legacy & Convenience Alias for BileoIconProps */
export type IconProps = BileoIconProps;
