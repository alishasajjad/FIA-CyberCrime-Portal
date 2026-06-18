import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdExpandMore } from "react-icons/md";

export default function Accordion({ items, className = "" }) {
  const [openIndex, setOpenIndex] = React.useState(null);

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-navy-700 dark:bg-navy-800"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6 md:py-5"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-navy-900 dark:text-white">
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 text-brand-600"
              >
                <MdExpandMore className="h-6 w-6" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="border-t border-gray-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-gray-600 dark:border-navy-700 dark:text-gray-300 md:px-6 md:pb-5">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
