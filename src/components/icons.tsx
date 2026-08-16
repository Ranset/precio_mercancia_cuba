import type { SVGProps } from 'react';

/** Íconos de línea, minimalistas, sin dependencias externas. Heredan color de `currentColor`. */

function base(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  };
}

export function IconCalculator(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
      <line x1="8" y1="6.5" x2="16" y2="6.5" />
      <line x1="7.7" y1="11" x2="7.7" y2="11" />
      <line x1="12" y1="11" x2="12" y2="11" />
      <line x1="16.3" y1="11" x2="16.3" y2="11" />
      <line x1="7.7" y1="14.7" x2="7.7" y2="14.7" />
      <line x1="12" y1="14.7" x2="12" y2="14.7" />
      <line x1="7.7" y1="18.4" x2="12" y2="18.4" />
      <line x1="16.3" y1="14.7" x2="16.3" y2="18.4" />
    </svg>
  );
}

export function IconSuitcase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="7" width="18" height="13" rx="2.2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      <line x1="3" y1="12.5" x2="21" y2="12.5" />
      <line x1="10.3" y1="12.5" x2="13.7" y2="12.5" />
    </svg>
  );
}

export function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.05 2.05 0 1 1-2.9 2.9l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.55V19.6a2.05 2.05 0 1 1-4.1 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2.05 2.05 0 1 1-2.9-2.9l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1.03H4.4a2.05 2.05 0 1 1 0-4.1h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.05 2.05 0 1 1 2.9-2.9l.06.06a1.7 1.7 0 0 0 1.87.34H10.5a1.7 1.7 0 0 0 1.03-1.55V4.4a2.05 2.05 0 1 1 4.1 0v.09a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.05 2.05 0 1 1 2.9 2.9l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.5a1.7 1.7 0 0 0 1.55 1.03h.09a2.05 2.05 0 1 1 0 4.1h-.09a1.7 1.7 0 0 0-1.55 1.03Z" />
    </svg>
  );
}

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <polyline points="4 7 20 7" />
      <path d="M9 7V4.6C9 4 9.4 3.5 10 3.5h4c.6 0 1 .5 1 1.1V7" />
      <path d="M6.5 7 7.3 19.2c.05.9.8 1.6 1.7 1.6h6c.9 0 1.65-.7 1.7-1.6L17.5 7" />
      <line x1="10.2" y1="11" x2="10.2" y2="16.5" />
      <line x1="13.8" y1="11" x2="13.8" y2="16.5" />
    </svg>
  );
}

export function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <polyline points="9 5 16 12 9 19" />
    </svg>
  );
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <polyline points="5 9 12 16 19 9" />
    </svg>
  );
}

export function IconShare(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 14.5V3.5" />
      <path d="M7.5 8 12 3.5 16.5 8" />
      <path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" />
    </svg>
  );
}

export function IconArrowUp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </svg>
  );
}

export function IconArrowDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="6 13 12 19 18 13" />
    </svg>
  );
}

export function IconSun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4.2" />
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="4.2" y1="4.2" x2="6" y2="6" />
      <line x1="18" y1="18" x2="19.8" y2="19.8" />
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
      <line x1="4.2" y1="19.8" x2="6" y2="18" />
      <line x1="18" y1="6" x2="19.8" y2="4.2" />
    </svg>
  );
}

export function IconMoon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function IconArrowLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="11 6 5 12 11 18" />
    </svg>
  );
}
