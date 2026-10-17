import React from "react";

export function PixelLoomEmblem({
  className = "w-7 h-7",
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  const mainColor = inverted ? "#FFFFFF" : "#18181B";

  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main Stem */}
      <rect x="15" y="15" width="17" height="90" rx="8.5" fill={mainColor} />
      {/* Top Beam */}
      <rect x="15" y="15" width="68" height="17" rx="8.5" fill={mainColor} />
      {/* Middle Crossbar */}
      <rect x="15" y="52" width="68" height="17" rx="8.5" fill={mainColor} />
      {/* Upper Right Column closing the P loop */}
      <rect x="66" y="15" width="17" height="54" rx="8.5" fill={mainColor} />
      {/* Signature Crimson Pixel Node */}
      <rect x="66" y="84" width="19" height="21" rx="6.5" fill="#E31C25" />
    </svg>
  );
}

export function PixelLoomFullLogo({
  className = "h-6 w-auto",
}: {
  className?: string;
}) {
  return (
    <img
      src="/logo/pixelloom_logo.svg"
      alt="PixelLoom"
      className={className}
    />
  );
}
