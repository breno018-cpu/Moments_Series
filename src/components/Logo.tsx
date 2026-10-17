import { memo } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: { box: "w-6 h-6 rounded-md", heart: 12, text: "text-base", gap: "gap-1.5" },
  md: { box: "w-8 h-8 rounded-lg", heart: 16, text: "text-xl", gap: "gap-2" },
  lg: { box: "w-10 h-10 rounded-xl", heart: 20, text: "text-2xl", gap: "gap-2.5" },
  xl: { box: "w-14 h-14 rounded-2xl", heart: 28, text: "text-4xl", gap: "gap-3" },
};

const Logo = memo(({ size = "md", className = "" }: LogoProps) => {
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} select-none ${className}`}>
      <div
        className={`${s.box} relative flex items-center justify-center flex-shrink-0 overflow-hidden`}
        style={{
          background: "linear-gradient(145deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.75) 100%)",
          boxShadow: "0 6px 18px hsl(var(--primary) / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.25)",
        }}
      >
        {/* gloss */}
        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
        <svg width={s.heart} height={s.heart} viewBox="0 0 24 24" fill="none" className="relative drop-shadow-[0_1px_2px_hsl(0_0%_0%/0.25)]">
          <path
            d="M12 21.1c-.3 0-.6-.1-.84-.32C6.2 16.28 3 13.37 3 9.6 3 6.5 5.4 4.1 8.4 4.1c1.5 0 2.85.63 3.6 1.66.75-1.03 2.1-1.66 3.6-1.66 3 0 5.4 2.4 5.4 5.5 0 3.77-3.2 6.68-8.16 11.18-.24.21-.54.32-.84.32z"
            fill="hsl(var(--primary-foreground))"
          />
          <path
            d="M8.6 6.6c-1.5 0-2.7 1.1-2.9 2.5"
            stroke="hsl(var(--primary) / 0.55)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className={`${s.text} font-display font-extrabold text-foreground tracking-tight leading-none`}>
        Hangar<span className="text-primary">Box</span>
      </span>
    </div>
  );
});

Logo.displayName = "Logo";

export default Logo;
