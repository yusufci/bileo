import React from 'react';
import type { RouteFacts } from '../../lib/turna/types';
import type { TransportType } from '../../types';
import { CompanyLogo } from '../CompanyLogo';

export interface RouteFactsLineProps {
  facts: RouteFacts;
  transportType?: TransportType;
  className?: string;
}

/** Text facts distilled from the landing page FAQ; each omitted when the page is silent. */
export function routeFactItems(facts: RouteFacts): string[] {
  const items: string[] = [];
  if (facts.carriersCount != null) items.push(`${facts.carriersCount} firma`);
  if (facts.cheapestWeekday) items.push(`En ucuz gün: ${facts.cheapestWeekday}`);
  if (facts.tripsPerDay != null) items.push(`Günde ${facts.tripsPerDay} sefer`);
  else if (facts.tripsPerWeek != null) items.push(`Haftada ${facts.tripsPerWeek} sefer`);
  if (facts.shortestDurationLabel) items.push(`En kısa süre ${facts.shortestDurationLabel}`);
  return items;
}

export function hasRouteFacts(facts: RouteFacts): boolean {
  return routeFactItems(facts).length > 0 || facts.popularCarriers.length > 0;
}

/**
 * Quiet one-line summary of what the Turna route page says about the route (not about the offers):
 * carrier count, up to five popular carrier logos, cheapest weekday, frequency and shortest duration.
 */
export const RouteFactsLine: React.FC<RouteFactsLineProps> = ({ facts, transportType, className = '' }) => {
  const items = routeFactItems(facts);
  const carriers = facts.popularCarriers.slice(0, 5);
  if (items.length === 0 && carriers.length === 0) return null;

  return (
    <div
      aria-label="Turna rota bilgisi"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-charcoal-muted ${className}`}
    >
      <span className="text-[10px] font-extrabold uppercase tracking-wider">Turna rota bilgisi</span>
      {items.map((text) => (
        <span key={text}>{text}</span>
      ))}
      {carriers.length > 0 && (
        <span className="flex items-center gap-2" aria-label={`Popüler firmalar: ${carriers.join(', ')}`}>
          {carriers.map((name) => (
            <CompanyLogo key={name} company={name} transportType={transportType} size="sm" />
          ))}
        </span>
      )}
    </div>
  );
};
