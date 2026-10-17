import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { PixelLoomEmblem } from "./PixelLoomLogo";


interface AdminTransitionOverlayProps {
  /** If true, the overlay is active (revealing or closing) */
  isActive?: boolean;
  /** Callback when the entrance transition finishes revealing */
  onEntered?: () => void;
  /** Label to show on entrance */
  label?: string;
  sublabel?: string;
  /** If true, starts in dark and dissolves into light */
  mode?: "enter-light" | "exit-dark";
}

export const AdminTransitionOverlay: React.FC<AdminTransitionOverlayProps> = ({
  isActive = true,
  onEntered,
  label = "Acesso Administrativo",
  sublabel = "Transição do Showrunner para o Painel Seguro...",
  mode = "enter-light",
}) => {
  const [stage, setStage] = useState<"initial" | "blooming" | "complete">("initial");

  useEffect(() => {
    if (!isActive) return;

    if (mode === "enter-light") {
      // Step 1: Hold dark frame briefly so no white flash occurs (250ms)
      const t1 = setTimeout(() => {
        setStage("blooming");
      }, 250);

      // Step 2: Transition completes, fully revealing the white admin
      const t2 = setTimeout(() => {
        setStage("complete");
        onEntered?.();
      }, 700);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (mode === "exit-dark") {
      const t = setTimeout(() => {
        setStage("complete");
        onEntered?.();
      }, 650);
      return () => clearTimeout(t);
    }
  }, [isActive, mode, onEntered]);

  if (stage === "complete") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="admin-portal-transition"
        initial={{ opacity: 1 }}
        animate={{
          opacity: stage === "blooming" ? 0 : 1,
        }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.75,
          ease: [0.22, 1, 0.36, 1], // ease-out cubic
        }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090b] pointer-events-none select-none overflow-hidden"
      >
        {/* 1. Ambient Background Glows (Transition bridge between dark & light) */}
        <motion.div
          animate={{
            scale: stage === "blooming" ? [1, 2.5] : 1,
            opacity: stage === "blooming" ? [0.4, 0] : 0.4,
          }}
          transition={{ duration: 0.85, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/30 via-rose-500/25 to-amber-500/20 blur-[100px] pointer-events-none"
        />

        {/* 2. Expanding White Light Iris Mask */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: stage === "blooming" ? 6 : 0,
            opacity: stage === "blooming" ? 1 : 0,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-[240px] h-[240px] rounded-full bg-radial from-white via-white/80 to-transparent blur-[20px] pointer-events-none"
        />

        {/* 3. Center Transition Card (Showrunner -> Admin) */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{
            scale: stage === "blooming" ? 1.05 : 1,
            opacity: stage === "blooming" ? 0 : 1,
            y: stage === "blooming" ? -15 : 0,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center px-6"
        >
          {/* Glowing Emblem Box */}
          <div className="relative mb-5">
            <div className="relative w-16 h-16 rounded-2xl bg-[#121217] border border-white/15 flex items-center justify-center shadow-2xl">
              <PixelLoomEmblem inverted className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#09090b] flex items-center justify-center text-zinc-950 shadow-md">
              <ShieldCheck size={11} strokeWidth={3} />
            </div>
          </div>

          {/* Micro Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase mb-3">
            <Sparkles size={11} className="text-amber-400" />
            <span>TRANSITION PROTOCOL</span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight mb-1">
            {label}
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-zinc-400 font-body max-w-sm leading-relaxed mb-6">
            {sublabel}
          </p>

          {/* Luxury Loading Bar */}
          <div className="w-56 h-1 bg-zinc-800/80 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: "easeInOut",
              }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#E31C25] to-purple-500 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminTransitionOverlay;
