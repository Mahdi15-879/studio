import type { SVGProps } from 'react';

export function ModelVerseLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="40"
      height="40"
      fill="currentColor"
      {...props}
    >
      <g transform="translate(50 50) scale(0.9)">
        {/* Simple 3D cube representation */}
        <polygon points="-20,-35 20,-35 40,-15 0,5 -40,-15" fillOpacity="0.7" />
        <polygon points="-20,-35 -40,-15 -40,25 -20,45 0,5" fillOpacity="0.9" />
        <polygon points="20,-35 40,-15 40,25 20,45 0,5" fillOpacity="0.8" />
      </g>
      <text
        x="50"
        y="95"
        fontSize="12"
        fontFamily="var(--font-geist-sans)"
        textAnchor="middle"
        fill="currentColor"
      >
        ModelVerse
      </text>
    </svg>
  );
}
