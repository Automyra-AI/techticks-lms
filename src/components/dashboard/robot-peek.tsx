"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * The little assistant that pops up over the top-left corner of the banner on
 * hover and waves hello.
 *
 * It lives outside the banner's `overflow-hidden` card so it can genuinely peek
 * *above* the top edge rather than being clipped by it. Visibility is driven by
 * the parent's hover variants, so there is no state and no timers.
 *
 * The artwork carries its own "Hi" speech bubble and is cut out to
 * transparency, so it drops onto either theme without a backing plate.
 */
export function RobotPeek() {
  const reduced = useReducedMotion();

  const robot: Variants = {
    rest: { opacity: 0, y: 34, scale: 0.7, rotate: -12 },
    peek: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 400, damping: 15 },
    },
  };

  // A gentle sway once it has arrived, so it reads as alive rather than pasted on.
  const sway: Variants = {
    rest: { rotate: 0 },
    peek: {
      rotate: [0, -3, 2, 0],
      transition: { duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8 },
    },
  };

  return (
    <div className="pointer-events-none absolute -top-14 left-3 z-20 sm:-top-16 sm:left-6">
      <motion.div variants={reduced ? { rest: { opacity: 0 }, peek: { opacity: 1 } } : robot} className="origin-bottom">
        <motion.div variants={reduced ? undefined : sway} className="origin-bottom">
          <Image
            src="/robot-hi.webp"
            alt=""
            width={132}
            height={115}
            className="h-[104px] w-auto drop-shadow-xl sm:h-[122px]"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
