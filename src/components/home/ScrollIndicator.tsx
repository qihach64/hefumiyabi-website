"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function ScrollIndicator() {
  const handleClick = () => {
    // 滚动到 Hero 下方的内容区域
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.8 }}
      onClick={handleClick}
    >
      <span className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2 group-hover:text-white/80 transition-colors">
        向下探索
      </span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        }}
      >
        <ChevronDown className="w-6 h-6 text-white/60 group-hover:text-white/80 transition-colors" />
      </motion.div>
    </motion.div>
  );
}
