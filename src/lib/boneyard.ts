import { configureBoneyard } from "boneyard-js/react";

// Global defaults for all <Skeleton> loading states (dark theme friendly)
configureBoneyard({
  color: "#1a1a1a",
  darkColor: "#1a1a1a",
  shimmerColor: "#2b2b2b",
  darkShimmerColor: "#2b2b2b",
  animate: "shimmer",
  speed: "1.6s",
  shimmerAngle: 110,
  stagger: 60,
  transition: 260,
  select: "viewport",
});

import "../bones/registry";
