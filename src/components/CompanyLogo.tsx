import React from 'react';
import { TransportType } from '../types';
import { renderBrandSVG } from './PartnerLogosRibbon';

interface CompanyLogoProps {
  company: string;
  transportType?: TransportType;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  company,
  className = '',
  size = 'md',
}) => {
  const heightClasses = {
    sm: 'h-6 max-w-[130px]',
    md: 'h-7 max-w-[155px]',
    lg: 'h-8 max-w-[180px]',
    xl: 'h-10 max-w-[220px]',
  }[size];

  return (
    <div
      className={`${heightClasses} flex items-center justify-start flex-shrink-0 transition-transform ${className}`}
      title={company}
    >
      {renderBrandSVG(company)}
    </div>
  );
};
