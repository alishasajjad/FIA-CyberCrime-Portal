const Faq = require("../models/Faq");

async function seedDefaultFaq() {
  const count = await Faq.countDocuments();
  if (count > 0) return;

  await Faq.insertMany([
    {
      question: "How can I track my complaint?",
      answer: "Open Track Complaint and search using reference ID or complaint ID.",
      order: 1,
      active: true,
    },
    {
      question: "Who can upload evidence?",
      answer: "Users and assigned officers can upload evidence to permitted cases.",
      order: 2,
      active: true,
    },
    {
      question: "When is a case considered closed?",
      answer: "Cases move to Resolved/Closed after verification by investigators/admin.",
      order: 3,
      active: true,
    },
  ]);

  console.log("[SeedFAQ] Default FAQ seeded");
}

module.exports = { seedDefaultFaq };

