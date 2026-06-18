import React from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

function Counter({ value, suffix = "" }) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const spring = useSpring(0, { duration: 2000, bounce: 0 });
  const display = useTransform(spring, (v) =>
    Math.floor(v).toLocaleString()
  );

  React.useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, spring, value]);

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

export default function AnimatedCounter({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            <Counter value={stat.value} suffix={stat.suffix || ""} />
          </div>
          <p className="mt-2 text-sm font-medium text-emerald-100 md:text-base">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
