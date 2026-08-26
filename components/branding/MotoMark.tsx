interface MotoMarkProps {
  className?: string;
  size?: number;
}

/** A compact road-and-speed inspired mark used throughout the MotoLog shell. */
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
          id="motolog-mark-accent"
          x1="16"
          x2="48"
          y1="14"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF9A5A" />
          <stop offset="0.48" stopColor="#FF6A17" />
          <stop offset="1" stopColor="#FF5502" />
        </linearGradient>
        <linearGradient
          id="motolog-mark-surface"
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
      <rect width="64" height="64" rx="18" fill="url(#motolog-mark-surface)" />
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
        d="M17.5 22.5C20.7 14.4 27.9 10 35.2 10C42.4 10 47.4 13.8 50.4 19"
        stroke="url(#motolog-mark-accent)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M15.5 47V23L32 40L48.5 23V47"
        stroke="#09090A"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="11"
      />
      <path
        d="M15.5 47V23L32 40L48.5 23V47"
        stroke="url(#motolog-mark-accent)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
      <path
        d="M15.5 47V23L32 40L48.5 23V47"
        stroke="#FFF4ED"
        strokeDasharray="4 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="15.5" cy="47" r="3" fill="#FF5502" />
      <circle cx="48.5" cy="47" r="3" fill="#FF5502" />
    </svg>
  );
}
