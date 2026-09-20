export default function LogoMark({ className = "", size = 24 }: { className?: string; size?: number }) {
  // SVG representation of the Swasthya-Sanket logo
  // Teal rounded square background, white ECG line, light teal dot
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#0D9488" />
      
      {/* Light teal dot top right */}
      <circle cx="24" cy="10" r="3.5" fill="#CCEBE9" />
      
      {/* White ECG line */}
      <path
        d="M6 17 L11 17 L14 11 L18 22 L21 16 L26 16"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Light teal dot on the left of ECG line */}
      <circle cx="7" cy="17" r="2" fill="#CCEBE9" />
    </svg>
  );
}
