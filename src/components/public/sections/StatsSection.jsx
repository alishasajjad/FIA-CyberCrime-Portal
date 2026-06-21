import React from "react";
import AnimatedCounter from "components/public/AnimatedCounter";
import SectionHeading from "components/public/SectionHeading";

const STATS = [
  { value: 125000, suffix: "+", label: "Complaints Processed" },
  { value: 3420, suffix: "+", label: "Active Investigations" },
  { value: 89000, suffix: "+", label: "Registered Users" },
  { value: 98000, suffix: "+", label: "Cases Resolved" },
];

export default function StatsSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-[#0f172a] to-emerald-950 py-20 md:py-24"
      aria-labelledby="stats-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #22c55e 0, transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="stats-heading"
          eyebrow="Impact"
          title="Portal Statistics"
          subtitle="Trusted by citizens nationwide for secure cyber crime reporting and resolution."
          light
        />
        <AnimatedCounter stats={STATS} />
      </div>
    </section>
  );
}
