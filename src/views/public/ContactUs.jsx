import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import ContactSection from "components/public/sections/ContactSection";

export default function ContactUs() {
  return (
    <>
      <PageMeta
        title="Contact Us"
        description="Contact the National Cyber Crime Reporting Portal support team via email, phone, or contact form."
      />
      <PageHeader
        title="Contact Us"
        subtitle="Our support team is available to assist with portal inquiries, technical issues, and general questions."
        breadcrumbs={[{ label: "Contact Us" }]}
      />
      <ContactSection />
    </>
  );
}
