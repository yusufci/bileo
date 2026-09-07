import React, { useState } from 'react';
import type { TransportType } from '../../types';
import { CompanyLogo } from '../CompanyLogo';
import {
  AVIATION_BRANDS,
  BUS_BRANDS,
  FOOTER_DISTINCT_BRANDS,
  RAIL_FERRY_BRANDS,
  getNormalizedBrandName,
} from '../PartnerLogosRibbon';

export type BrandLogoSize = 'sm' | 'md' | 'lg';

export interface BrandLogoProps {
  /** Carrier or company name exactly as the source publishes it. */
  name: string;
  transportType?: TransportType;
  /** Remote logo (Turna CDN, Cloudinary); used only when bileo has no vector mark for the name. */
  logoUrl?: string | null;
  size?: BrandLogoSize;
  className?: string;
}

/**
 * Every brand `renderBrandSVG` draws with a vector mark. Its alias cases (e.g. "Turkish Airlines",
 * "BUDO Express") all normalise to one of these canonical names, so membership of the normalised
 * name is the exact "bileo has an SVG" predicate.
 */
const BRAND_MARKS: ReadonlySet<string> = new Set<string>([
  ...AVIATION_BRANDS,
  ...BUS_BRANDS,
  ...RAIL_FERRY_BRANDS,
  ...FOOTER_DISTINCT_BRANDS,
]);

export function hasBrandMark(name: string): boolean {
  return BRAND_MARKS.has(getNormalizedBrandName(name));
}

/** Only absolute https URLs are ever placed in an <img src>. */
export function isRenderableLogoUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(url);
}

const SIZE_CLASS: Record<BrandLogoSize, string> = {
  sm: 'h-6 max-w-[130px]',
  md: 'h-7 max-w-[155px]',
  lg: 'h-8 max-w-[180px]',
};

/**
 * Brand mark with a three-step fallback chain: bileo vector mark, remote logo image, text logo.
 * SSR-safe: the first render never touches window or document; the image failure flag lives in
 * state (keyed by URL so a different logo gets a fresh attempt) and only flips in the browser.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ name, transportType, logoUrl, size = 'md', className = '' }) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const label = name.trim() || name;

  if (hasBrandMark(label)) {
    return <CompanyLogo company={label} transportType={transportType} size={size} className={className} />;
  }

  const box = `${SIZE_CLASS[size]} flex items-center justify-start flex-shrink-0 min-w-0 ${className}`;

  if (isRenderableLogoUrl(logoUrl) && failedUrl !== logoUrl) {
    return (
      <span className={box} title={label}>
        <img
          src={logoUrl}
          alt={label}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(logoUrl)}
          className="h-full w-auto max-w-full object-contain"
        />
      </span>
    );
  }

  return (
    <span className={box} title={label}>
      <span className="text-sm font-extrabold text-[#1E1B18] tracking-tight truncate">{label}</span>
    </span>
  );
};
