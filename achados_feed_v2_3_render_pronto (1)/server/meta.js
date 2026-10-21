function safeMetaText(value) {
  return String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function renderMetadata(html,config) {
  const title = safeMetaText(config.seoTitle);
  const desc = safeMetaText(config.seoDescription);
  return html
    .replace(/<title>[^<]*<\/title>/i, () => `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i, () => `<meta name="description" content="${desc}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, () => `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, () => `<meta property="og:description" content="${desc}" />`);
}
