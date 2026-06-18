import React from "react";

const SITE_NAME = "National Cyber Crime Reporting Portal — FIA Pakistan";
const DEFAULT_DESCRIPTION =
  "Official FIA Cyber Crime Wing portal, Government of Pakistan, for reporting cyber crimes under PECA 2016, tracking complaints, and accessing cyber security awareness resources.";
const DEFAULT_OG_IMAGE = "/favicon.ico";

export default function PageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  React.useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name, content, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:type", ogType, true);
    setMeta("og:image", ogImage, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
  }, [fullTitle, description, ogImage, ogType]);

  return null;
}

export { SITE_NAME, DEFAULT_DESCRIPTION };
