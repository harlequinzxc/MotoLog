interface AppLogoProps {
  className?: string;
  size?: number;
}

/** Text-free brand emblem rendered from the generated PWA asset. */
export function AppLogo({ className, size = 40 }: AppLogoProps) {
  return (
    <img
      alt="MotoLog"
      className={className}
      height={size}
      src="/favicon.svg"
      width={size}
    />
  );
}
