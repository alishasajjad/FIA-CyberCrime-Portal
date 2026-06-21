import React from "react";
import { motion } from "framer-motion";

export default function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  align = "center",
  light = false,
}) {
  const alignClass =
    align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`mb-12 max-w-3xl ${alignClass}`}
    >
      {eyebrow && (
        <p
          className={`mb-3 text-xs font-bold uppercase tracking-[0.2em] ${
            light ? "text-emerald-300" : "text-brand-600"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={`text-3xl font-bold tracking-tight md:text-4xl ${
          light ? "text-white" : "text-navy-900 dark:text-white"
        }`}
      >
        {title}
      </h2>
      <span
        aria-hidden
        className={`mt-4 block h-1 w-16 rounded-full bg-gradient-to-r ${
          light
            ? "from-emerald-300 to-emerald-500"
            : "from-brand-500 to-emerald-400"
        } ${align === "center" ? "mx-auto" : ""}`}
      />
      {subtitle && (
        <p
          className={`mt-4 text-base leading-relaxed md:text-lg ${
            light ? "text-slate-300" : "text-gray-600 dark:text-gray-300"
          }`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
