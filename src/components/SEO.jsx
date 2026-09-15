import { useEffect } from 'react';

function setMeta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function SEO({
  title,
  description,
  canonical,
  image,
  type = 'website',
  keywords,
  jsonLd
}) {
  useEffect(() => {
    const fullTitle = title || 'GovPortal';
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    if (image) setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', canonical || window.location.href);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    if (image) setMeta('name', 'twitter:image', image);

    if (canonical) setLink('canonical', canonical);

    const prev = document.getElementById('jsonld-page');
    if (prev) prev.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'jsonld-page';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, image, type, keywords, jsonLd]);

  return null;
}
