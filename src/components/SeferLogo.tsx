import React from 'react';

export interface SeferLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'bordeaux' | 'white';
  showTagline?: boolean;
  className?: string;
}

export const SeferLogo: React.FC<SeferLogoProps> = ({
  size = 'md',
  variant = 'bordeaux',
  showTagline = false,
  className = '',
}) => {
  // Dimensions and font scaling
  const config = {
    sm: {
      fontSize: 22,
      dotRadius: 3,
      taglineSize: 7,
      gap: 1.5,
      dotBottom: 1.5,
    },
    md: {
      fontSize: 30,
      dotRadius: 4,
      taglineSize: 8.5,
      gap: 2,
      dotBottom: 2.5,
    },
    lg: {
      fontSize: 38,
      dotRadius: 5,
      taglineSize: 10,
      gap: 2.5,
      dotBottom: 3,
    },
    xl: {
      fontSize: 48,
      dotRadius: 6.5,
      taglineSize: 12,
      gap: 3,
      dotBottom: 4,
    },
  }[size];

  const textColor = {
    dark: '#1E1B18',
    bordeaux: '#8A222B',
    white: '#FFFFFF',
  }[variant];

  const dotColor = {
    dark: '#8A222B',
    bordeaux: '#8A222B',
    white: '#E30613',
  }[variant];

  const taglineColor = {
    dark: '#777169',
    bordeaux: '#8A222B',
    white: 'rgba(255, 255, 255, 0.75)',
  }[variant];

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="flex items-baseline leading-none">
        {/* Bespoke Editorial Typographic Mark */}
        <span
          className="font-black tracking-tight font-display transition-colors"
          style={{
            fontSize: `${config.fontSize}px`,
            color: textColor,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          sefer
        </span>

        {/* Signature Transit Period / Focal Point */}
        <span
          className="rounded-full flex-shrink-0 transition-transform duration-200"
          style={{
            width: `${config.dotRadius * 2}px`,
            height: `${config.dotRadius * 2}px`,
            backgroundColor: dotColor,
            marginLeft: `${config.gap}px`,
            marginBottom: `${config.dotBottom}px`,
          }}
        />
      </div>

      {showTagline && (
        <span
          className="font-black uppercase tracking-[0.25em] mt-1 transition-colors"
          style={{
            fontSize: `${config.taglineSize}px`,
            color: taglineColor,
          }}
        >
          Türkiye'nin Sefer Ağı
        </span>
      )}
    </div>
  );
};
