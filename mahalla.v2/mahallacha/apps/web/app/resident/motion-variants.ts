import type { Variants } from "framer-motion";

const TRANSITION = { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };
const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };

/** prefers-reduced-motion: minimal animatsiya */
export const reducedVariants = {
  page: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 }
  },
  card: {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  }
};

/** To‘liq page enter/exit — fade, slide, blur */
export const pageVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? 16 : -12,
    filter: "blur(8px)"
  }),
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: TRANSITION
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? -12 : 16,
    filter: "blur(8px)",
    transition: { ...TRANSITION, duration: 0.25 }
  })
};

/** Fade + Slide up — yangi sahifa sekin paydo bo‘ladi, yuqoriga ko‘tariladi */
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 32
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] }
  },
  exit: {
    opacity: 0,
    y: -24,
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
  }
};

/** Stagger: cards va list items */
export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      staggerDirection: 1
    }
  }
};

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION, duration: 0.35 }
  }
};

/** Card stagger — 0.06–0.1s orasida */
export const cardContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.07
    }
  }
};

export const cardItemVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: SPRING
  }
};

export { SPRING, TRANSITION };
