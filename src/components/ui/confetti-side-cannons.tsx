"use client";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";

/**
 * Standalone client-side function to trigger side confetti cannons for 3 seconds.
 */
export function triggerConfettiSideCannons() {
  const end = Date.now() + 2 * 1000; //
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
  let cancelled = false;
  let animationFrameId: number;

  const frame = () => {
    if (cancelled || Date.now() > end) return;
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });
    animationFrameId = requestAnimationFrame(frame);
  };
  frame();

  return () => {
    cancelled = true;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    confetti.reset();
  };
}

export function ConfettiSideCannons() {
  return (
    <div className="relative">
      <Button onClick={triggerConfettiSideCannons}>Trigger Side Cannons</Button>
    </div>
  );
}
