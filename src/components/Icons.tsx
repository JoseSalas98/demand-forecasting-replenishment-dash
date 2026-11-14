// Íconos de línea (24px, currentColor) para el panel lateral.
import type { ReactNode } from 'react';

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconHome = () => (
  <Svg>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M10 21v-6h4v6" />
  </Svg>
);

export const IconGrid = () => (
  <Svg>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </Svg>
);

export const IconPulse = () => (
  <Svg>
    <path d="M2 12h4l3-8 4 16 3-8h6" />
  </Svg>
);

export const IconDollar = () => (
  <Svg>
    <path d="M12 2v20" />
    <path d="M17 6.5c-1-1.3-2.8-2-5-2-2.8 0-4.5 1.4-4.5 3.4 0 4.6 9.5 2.4 9.5 7.2 0 2-1.9 3.4-4.8 3.4-2.3 0-4.2-.8-5.2-2.2" />
  </Svg>
);

export const IconHelp = () => (
  <Svg>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.4-2.6 4" />
    <path d="M12 17.6h.01" />
  </Svg>
);

export const IconData = () => (
  <Svg>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" />
    <path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13" />
    <path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" />
  </Svg>
);
