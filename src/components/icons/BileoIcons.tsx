import React from 'react';
import { BileoIconProps } from './types';

// ============================================================================
// GROUP 1: NAVIGATION & CONTROLS (10 ICONS)
// ============================================================================

/**
 * Bileo Directional Left Arrow
 */
export const BileoArrowLeft = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  )
);
BileoArrowLeft.displayName = 'BileoArrowLeft';

/**
 * Bileo Directional Right Arrow
 */
export const BileoArrowRight = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  )
);
BileoArrowRight.displayName = 'BileoArrowRight';

/**
 * Bileo Opposing Bidirectional Swap Arrows (City / Route Swap)
 */
export const BileoSwapHorizontal = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M20 7H4" />
      <path d="M16 3l4 4-4 4" />
      <path d="M4 17h16" />
      <path d="M8 21l-4-4 4-4" />
    </svg>
  )
);
BileoSwapHorizontal.displayName = 'BileoSwapHorizontal';

/**
 * Bileo Navigational Chevron Left (Carousels & Pagination)
 */
export const BileoChevronLeft = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
);
BileoChevronLeft.displayName = 'BileoChevronLeft';

/**
 * Bileo Navigational Chevron Right (Lists & Buttons)
 */
export const BileoChevronRight = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
);
BileoChevronRight.displayName = 'BileoChevronRight';

/**
 * Bileo Double Chevron Right (Slide-to-confirm physical handle)
 */
export const BileoChevronsRight = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M6 17l5-5-5-5" />
      <path d="M13 17l5-5-5-5" />
    </svg>
  )
);
BileoChevronsRight.displayName = 'BileoChevronsRight';

/**
 * Bileo Close / Dismiss Cross Icon
 */
export const BileoClose = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  )
);
BileoClose.displayName = 'BileoClose';

/**
 * Bileo Plus / Add Action Icon
 */
export const BileoPlus = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
);
BileoPlus.displayName = 'BileoPlus';

/**
 * Bileo Filter Funnel Icon
 */
export const BileoFilter = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M3 4h18l-7 8.5v6.5l-4-2v-4.5L3 4z" />
    </svg>
  )
);
BileoFilter.displayName = 'BileoFilter';

/**
 * Bileo Sort Lines Icon
 */
export const BileoSort = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M3 6h18" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  )
);
BileoSort.displayName = 'BileoSort';

// ============================================================================
// GROUP 2: TRAVEL & BOOKING (7 ICONS)
// ============================================================================

/**
 * Bileo Calendar / Departure Date Icon
 */
export const BileoCalendar = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
    </svg>
  )
);
BileoCalendar.displayName = 'BileoCalendar';

/**
 * Bileo Clock / Duration & Departure Time Icon
 */
export const BileoClock = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
);
BileoClock.displayName = 'BileoClock';

/**
 * Bileo Search Lens Icon
 */
export const BileoSearch = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
);
BileoSearch.displayName = 'BileoSearch';

/**
 * Bileo Terminal / Location Map Pin Icon
 */
export const BileoMapPin = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
);
BileoMapPin.displayName = 'BileoMapPin';

/**
 * Bileo Boarding Pass & Ticket Stub Icon
 */
export const BileoTicket = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3z" />
      <path d="M12 6v2M12 11v2M12 16v2" />
    </svg>
  )
);
BileoTicket.displayName = 'BileoTicket';

/**
 * Bileo Passenger Profile & User Icon
 */
export const BileoUser = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    </svg>
  )
);
BileoUser.displayName = 'BileoUser';

/**
 * Bileo Discovery Compass Icon
 */
export const BileoCompass = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
);
BileoCompass.displayName = 'BileoCompass';

// ============================================================================
// GROUP 3: UTILITIES & VERIFICATION (15 ICONS)
// ============================================================================

/**
 * Bileo Precision Single Checkmark Icon
 */
export const BileoCheck = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 2.0, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
);
BileoCheck.displayName = 'BileoCheck';

/**
 * Bileo Circular Enclosed Checkmark Badge Icon
 */
export const BileoCheckCircle = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12.5l3 3 5-5" />
    </svg>
  )
);
BileoCheckCircle.displayName = 'BileoCheckCircle';

/**
 * Bileo Document Copy / Clipboard Icon (PNR Copy)
 */
export const BileoCopy = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
);
BileoCopy.displayName = 'BileoCopy';

/**
 * Bileo Credit Card Payment Icon
 */
export const BileoCreditCard = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  )
);
BileoCreditCard.displayName = 'BileoCreditCard';

/**
 * Bileo 256-bit SSL Padlock Security Icon
 */
export const BileoLock = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <rect x="4" y="11" width="16" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  )
);
BileoLock.displayName = 'BileoLock';

/**
 * Bileo Printer / PDF Document Export Icon
 */
export const BileoPrinter = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  )
);
BileoPrinter.displayName = 'BileoPrinter';

/**
 * Bileo Counter-Clockwise Rotate / Refund & Reset Icon
 */
export const BileoRotateCcw = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
);
BileoRotateCcw.displayName = 'BileoRotateCcw';

/**
 * Bileo Dual Circular Refresh Icon
 */
export const BileoRefresh = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
);
BileoRefresh.displayName = 'BileoRefresh';

/**
 * Bileo Trust & SSL Security Shield Check Icon
 */
export const BileoShieldCheck = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
);
BileoShieldCheck.displayName = 'BileoShieldCheck';

/**
 * Bileo Coupon & Discount Tag Icon
 */
export const BileoTag = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </svg>
  )
);
BileoTag.displayName = 'BileoTag';

/**
 * Bileo Mail Envelope / E-Ticket Notification Icon
 */
export const BileoMail = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  )
);
BileoMail.displayName = 'BileoMail';

/**
 * Bileo Alert / Error Warning Circle Icon
 */
export const BileoAlertCircle = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
);
BileoAlertCircle.displayName = 'BileoAlertCircle';

/**
 * Bileo 24/7 Support Headphones Icon
 */
export const BileoHeadphones = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  )
);
BileoHeadphones.displayName = 'BileoHeadphones';

/**
 * Bileo Passion Heart Icon (Supports Tailwind fill-* overrides)
 */
export const BileoHeart = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
);
BileoHeart.displayName = 'BileoHeart';

/**
 * Bileo Review Rating Star Icon (Supports Tailwind fill-* and direct fill overrides)
 */
export const BileoStar = React.forwardRef<SVGSVGElement, BileoIconProps & { fill?: string }>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, fill = 'none', title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
);
BileoStar.displayName = 'BileoStar';

// ============================================================================
// GROUP 4: AMENITIES & HIGHLIGHTS (6 ICONS)
// ============================================================================

/**
 * Bileo Luxury Guarantee Sparkles Icon
 */
export const BileoSparkles = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4" />
      <path d="M19 17v4M21 19h-4" />
    </svg>
  )
);
BileoSparkles.displayName = 'BileoSparkles';

/**
 * Bileo Baggage & Suitcase Luggage Icon
 */
export const BileoLuggage = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <rect x="5" y="6" width="14" height="14" rx="2" />
      <path d="M5 11h14" />
      <path d="M5 15h14" />
      <path d="M8 20v2" />
      <path d="M16 20v2" />
    </svg>
  )
);
BileoLuggage.displayName = 'BileoLuggage';

/**
 * Bileo High-Speed Wi-Fi Amenity Icon
 */
export const BileoWifi = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M1.5 8.5A15 15 0 0 1 22.5 8.5" />
      <path d="M5 12A10 10 0 0 1 19 12" />
      <path d="M8.5 15.5A5 5 0 0 1 15.5 15.5" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  )
);
BileoWifi.displayName = 'BileoWifi';

/**
 * Bileo 220V Electric Power Lightning Bolt Icon
 */
export const BileoZap = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
);
BileoZap.displayName = 'BileoZap';

/**
 * Bileo Hot Beverage & Catering Amenity Coffee Icon
 */
export const BileoCoffee = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v7a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <path d="M6 1v3" />
      <path d="M10 1v3" />
      <path d="M14 1v3" />
    </svg>
  )
);
BileoCoffee.displayName = 'BileoCoffee';

/**
 * Bileo Seatback Multimedia TV / Screen Entertainment Icon
 */
export const BileoTv = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M17 2l-5 5-5-5" />
    </svg>
  )
);
BileoTv.displayName = 'BileoTv';

/**
 * Bileo Telephone / Mobile Phone Vector Icon
 */
export const BileoPhone = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
);
BileoPhone.displayName = 'BileoPhone';

/**
 * Bileo Password Visibility Eye Icon
 */
export const BileoEye = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
);
BileoEye.displayName = 'BileoEye';

/**
 * Bileo Password Hide Eye-Off Icon
 */
export const BileoEyeOff = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
);
BileoEyeOff.displayName = 'BileoEyeOff';

/**
 * Bileo Log Out / Exit Vector Icon
 */
export const BileoLogOut = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
);
BileoLogOut.displayName = 'BileoLogOut';

/**
 * Bileo Thumbs Up / Like Vector Icon
 */
export const BileoThumbUp = React.forwardRef<SVGSVGElement, BileoIconProps & { fill?: string }>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, fill = 'none', title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
);
BileoThumbUp.displayName = 'BileoThumbUp';

/**
 * Bileo Thumbs Down / Dislike Vector Icon
 */
export const BileoThumbDown = React.forwardRef<SVGSVGElement, BileoIconProps & { fill?: string }>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, fill = 'none', title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  )
);
BileoThumbDown.displayName = 'BileoThumbDown';

/**
 * Bileo Message / Reply Vector Icon
 */
export const BileoMessageSquare = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
);
BileoMessageSquare.displayName = 'BileoMessageSquare';

// ============================================================================
// COMPATIBILITY & SEMANTIC ALIASES
// ============================================================================

export const BileoX = BileoClose;
export const BileoArrowRightLeft = BileoSwapHorizontal;
export const BileoCheckCircle2 = BileoCheckCircle;
export const BileoRefreshCw = BileoRefresh;
export const BileoPower = BileoZap;
export const BileoArrowUpDown = BileoSort;
export const BileoLogout = BileoLogOut;

/**
 * Authentic 4-Color Google Vector Icon
 */
export const BileoGoogleIcon = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.75, color, title, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size || 18}
      height={size || 18}
      className={className}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      {title && <title>{title}</title>}
      <path
        fill="#4285F4"
        stroke="none"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        stroke="none"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        stroke="none"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        stroke="none"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
);
BileoGoogleIcon.displayName = 'BileoGoogleIcon';


