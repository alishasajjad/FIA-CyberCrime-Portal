import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import { motion } from "framer-motion";
import { MdAccessTime, MdCategory, MdChevronRight } from "react-icons/md";

const ARTICLES = [
  {
    title: "Understanding Ransomware: Protect Your Business Files",
    summary: "Ransomware encryption can lock down corporate networks in minutes. Learn the primary attack vectors and how robust backup configurations block ransomware actors.",
    category: "Security Guide",
    date: "June 14, 2026",
    readTime: "5 min read",
    bgGradient: "from-blue-500/5 to-cyan-500/5 dark:from-blue-900/10 dark:to-cyan-900/10",
  },
  {
    title: "How to Detect & Report Online Financial Fraud",
    summary: "Phishing scams imitating banking support numbers target local citizens daily. Read how to act fast if you accidentally share banking PINs or otp codes.",
    category: "Financial Safety",
    date: "June 08, 2026",
    readTime: "4 min read",
    bgGradient: "from-emerald-500/5 to-teal-500/5 dark:from-emerald-900/10 dark:to-teal-900/10",
  },
  {
    title: "Rising Threat of Deepfakes: Verification Strategies",
    summary: "Generative AI synthetic media can deceive families and organizations. Understand authentication checks to verify video call identities and voice note integrity.",
    category: "AI Threat",
    date: "May 28, 2026",
    readTime: "6 min read",
    bgGradient: "from-purple-500/5 to-pink-500/5 dark:from-purple-900/10 dark:to-pink-900/10",
  },
  {
    title: "Protecting Children on Social Media Platforms",
    summary: "Stalking and cyber bullying present major concerns for young users. Set up parent protection widgets and guidelines to prevent online exploitation.",
    category: "Family Safety",
    date: "May 19, 2026",
    readTime: "5 min read",
    bgGradient: "from-amber-500/5 to-orange-500/5 dark:from-amber-900/10 dark:to-orange-900/10",
  },
];

export default function Blog() {
  return (
    <>
      <PageMeta
        title="Awareness Blog"
        description="Read cyber crime prevention articles, digital safety guides, AI deepfake checks, and technical insights from FIA officers."
      />
      <PageHeader
        title="Awareness Blog"
        subtitle="Stay updated with security alerts, educational articles, and guidelines curated by cybersecurity professionals."
        breadcrumbs={[{ label: "Blog" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {ARTICLES.map((article, i) => (
            <motion.article
              key={article.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group flex flex-col justify-between rounded-3xl border border-gray-200/80 bg-gradient-to-br ${article.bgGradient} p-6 dark:border-navy-700 hover:shadow-lg hover:border-brand-500/30 transition-all duration-300`}
            >
              <div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 font-bold text-brand-700 dark:text-brand-400">
                    <MdCategory className="h-4 w-4" />
                    {article.category}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 dark:text-gray-400">{article.date}</span>
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-navy-900 dark:text-white leading-snug group-hover:text-brand-650 transition-colors">
                  {article.title}
                </h3>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MdAccessTime className="h-4 w-4" />
                  {article.readTime}
                </span>
                <span className="flex items-center gap-0.5 text-sm font-bold text-brand-750 group-hover:translate-x-1 transition-transform dark:text-brand-400 cursor-pointer">
                  Read Article <MdChevronRight className="h-5 w-5" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </>
  );
}
