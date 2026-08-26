interface MotoMarkProps {
  className?: string;
  size?: number;
}

/** A compact, simplified fuel gauge mark for the MotoLog shell. */
export function MotoMark({ className, size = 36 }: MotoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="motolog-gauge-accent"
          x1="16"
          x2="48"
          y1="22"
          y2="45"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF9A5A" />
          <stop offset="0.56" stopColor="#FF6A17" />
          <stop offset="1" stopColor="#FF5502" />
        </linearGradient>
        <linearGradient
          id="motolog-gauge-surface"
          x1="8"
          x2="56"
          y1="6"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#292930" />
          <stop offset="1" stopColor="#111114" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#motolog-gauge-surface)" />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="17"
        stroke="#FFFFFF"
        strokeOpacity="0.06"
      />
      <path
        d="M14 43C14 29 22 21 32 21C42 21 50 29 50 43"
        stroke="#34343B"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <path
        d="M14 43C14 29 22 21 32 21C42 21 50 29 50 43"
        stroke="url(#motolog-gauge-accent)"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M20 35L23 36.5M32 28V31M44 35L41 36.5"
        stroke="#FFF4ED"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M32 42L41.5 30.5"
        stroke="#FFF4ED"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="32" cy="42" r="5.5" fill="#FF5502" />
      <circle cx="32" cy="42" r="2" fill="#FFF4ED" />
      <path
        d="M21 50H43"
        stroke="#34343B"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}
