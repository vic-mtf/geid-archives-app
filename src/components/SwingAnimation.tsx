import { motion } from "framer-motion";

interface SwingAnimationProps {
  delay?: number;
  onFinish?: (event: unknown) => void;
  children?: React.ReactNode;
}

export default function SwingAnimation({ delay = 0, onFinish, children }: SwingAnimationProps) {
  const variants = {
    hidden: { rotate: 0 },
    swing: {
      rotate: [0, 30, -20, 10, -10, 0],
      transition: {
        duration: 0.8,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        loop: Infinity,
        delay: delay,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="swing"
      onAnimationComplete={(event) => {
        window.setTimeout(() => {
          if (typeof onFinish === "function") onFinish(event);
        }, delay * 1000);
      }}>
      {children}
    </motion.div>
  );
}
