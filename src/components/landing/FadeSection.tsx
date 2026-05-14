"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type FadeSectionProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  delay?: number;
};

export function FadeSection({
  children,
  className,
  delay = 0,
  ...rest
}: FadeSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
