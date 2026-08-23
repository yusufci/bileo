import React from 'react';
import { BileoIconProps } from './types';

/**
 * Bileo Custom Bus Icon:
 * Aerodynamic long-distance luxury coach with double-decker panoramic windshield,
 * streamline body line, luggage compartment outline, and stylized wheels.
 */
export const BileoBusIcon = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.8, color, title, ...props }, ref) => (
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
      {/* Coach Main Chassis / Body Outline */}
      <path d="M4 6.5C4 5.12 5.12 4 6.5 4h11C18.88 4 20 5.12 20 6.5v10C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5v-10z" />
      
      {/* Panoramic Upper & Lower Windshield Split */}
      <path d="M4 9.5h16" />
      <path d="M9.5 4v5.5" />
      <path d="M14.5 4v5.5" />
      
      {/* Passenger Side Windows */}
      <path d="M7 13.5h2" />
      <path d="M11 13.5h2" />
      <path d="M15 13.5h2" />
      
      {/* Headlights */}
      <circle cx="6.5" cy="16" r="0.75" fill="currentColor" />
      <circle cx="17.5" cy="16" r="0.75" fill="currentColor" />
      
      {/* Lower Wheels */}
      <path d="M6 18v2.5a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5V18" />
      <path d="M15.5 18v2.5a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5V18" />
      
      {/* Aerodynamic Roof AC Vent */}
      <path d="M9 2.5h6" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
    </svg>
  )
);
BileoBusIcon.displayName = 'BileoBusIcon';

/**
 * Bileo Custom Airplane Icon:
 * 100% Mathematically Symmetric Commercial Jetliner across x=12 vertical axis.
 * Swept-back wings, twin balanced jet engines, and mirrored tail stabilizers.
 */
export const BileoPlaneIcon = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.8, color, title, ...props }, ref) => (
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
      {/* Perfectly Symmetric Plane Body & Wings Path */}
      <path d="M12 2C11.2 2 10.8 3.5 10.8 6v4.5L2.5 14.5v1.8l8.3-2v4.2L7 21v1.5l5-1.2 5 1.2V21l-3.8-2.5v-4.2l8.3 2v-1.8L13.2 10.5V6c0-2.5-.4-4-1.2-4z" />
      
      {/* Symmetrically Mirrored Engine Pods (x=7.5 and x=16.5 -> delta=4.5 from center) */}
      <path d="M7.5 12v2.5" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
      <path d="M16.5 12v2.5" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
    </svg>
  )
);
BileoPlaneIcon.displayName = 'BileoPlaneIcon';

/**
 * Bileo Custom High-Speed Train Icon (YHT):
 * Aerodynamic bullet train with iconic sloped nose, cockpit visor,
 * streamlined cabin windows, and roof catenary pantograph.
 */
export const BileoTrainIcon = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.8, color, title, ...props }, ref) => (
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
      {/* Bullet Train Aerodynamic Profile */}
      <path d="M5 18V8c0-3.3 2.5-5 7-5s7 1.7 7 5v10c0 .8-.7 1.5-1.5 1.5h-11C5.7 19.5 5 18.8 5 18z" />
      
      {/* Aerodynamic Cockpit Glass / Visor */}
      <path d="M7 7.5C8 6.2 10 5.5 12 5.5s4 .7 5 2" />
      
      {/* Cabin Front Divider */}
      <path d="M5 12.5h14" />
      
      {/* Dual Headlight Cluster */}
      <circle cx="8" cy="15.5" r="1" fill="currentColor" />
      <circle cx="16" cy="15.5" r="1" fill="currentColor" />
      
      {/* High-Speed Track Rails */}
      <path d="M3 21.5h18" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
      <path d="M7 19.5l-2 2" />
      <path d="M17 19.5l2 2" />
    </svg>
  )
);
BileoTrainIcon.displayName = 'BileoTrainIcon';

/**
 * Bileo Custom Ferry / Catamaran Icon:
 * Wave-piercing twin-hull catamaran with passenger observation decks,
 * navigation bridge, and hydro-wake waves.
 */
export const BileoFerryIcon = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.8, color, title, ...props }, ref) => (
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
      {/* Twin-Hull Catamaran Vessel Base */}
      <path d="M3.5 15.5l1.5-5.5h14l1.5 5.5c-1.5.5-3.5.5-5 0s-3.5-.5-5 0-3.5.5-5 0z" />
      
      {/* Observation Upper Deck / Cabin */}
      <path d="M6.5 10V6.5h11V10" />
      
      {/* Bridge Windows */}
      <path d="M9 8h6" />
      
      {/* Radar Mast & Chimney */}
      <path d="M12 4v2.5" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
      <path d="M10.5 4h3" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
      
      {/* Ocean Waves */}
      <path d="M2 19c2 1 4 1 6 0s4-1 6 0 4 1 6 0" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
      <path d="M4 21.5c1.5.7 3 .7 4.5 0s3-.7 4.5 0 3 .7 4.5 0" strokeWidth={typeof strokeWidth === 'number' ? Math.max(0.8, strokeWidth - 0.6) : '1.2'} strokeOpacity="0.7" />
    </svg>
  )
);
BileoFerryIcon.displayName = 'BileoFerryIcon';

/**
 * Bileo Custom Male (Bay / Erkek) Passenger Icon:
 * Tailored executive suit silhouette with clean collar lines.
 */
export const BileoMaleIcon = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.8, color, title, ...props }, ref) => (
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
      <path d="M5.5 21v-2a4.5 4.5 0 0 1 4.5-4.5h4a4.5 4.5 0 0 1 4.5 4.5v2" />
      <path d="M12 11v3.5" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
      <path d="M10.5 13l1.5 1.5 1.5-1.5" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.3) : '1.5'} />
    </svg>
  )
);
BileoMaleIcon.displayName = 'BileoMaleIcon';

/**
 * Bileo Custom Female (Bayan / Kadın) Passenger Icon:
 * Elegant executive silhouette with graceful neckline and stylized hairstyle curve.
 */
export const BileoFemaleIcon = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-4 h-4', size, strokeWidth = 1.8, color, title, ...props }, ref) => (
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
      <path d="M6 21v-1.8a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5V21" />
      <path d="M8 8.5c0 2.5 1.8 4 4 4s4-1.5 4-4" strokeWidth={typeof strokeWidth === 'number' ? Math.max(1, strokeWidth - 0.4) : '1.4'} />
    </svg>
  )
);
BileoFemaleIcon.displayName = 'BileoFemaleIcon';

/**
 * Bileo Custom Checkmark Icon (Yeşil Seçim Tik İkonu):
 * Precision clean vector checkmark for selected seats & badges.
 */
export const BileoCheckIcon = React.forwardRef<SVGSVGElement, BileoIconProps>(
  ({ className = 'w-3 h-3', size, strokeWidth = 2.8, color, title, ...props }, ref) => (
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
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
);
BileoCheckIcon.displayName = 'BileoCheckIcon';

// Backward Compatibility Drop-in Aliases
export const BusIcon = BileoBusIcon;
export const PlaneIcon = BileoPlaneIcon;
export const FlightIcon = BileoPlaneIcon;
export const TrainIcon = BileoTrainIcon;
export const FerryIcon = BileoFerryIcon;
export const MaleIcon = BileoMaleIcon;
export const FemaleIcon = BileoFemaleIcon;
export const CheckIcon = BileoCheckIcon;