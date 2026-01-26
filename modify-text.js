function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function capitalizeFirst(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function smartCapitalize(text) {
  return text.replace(/\b(ms|mr|mrs|dr)\.?\s*\w+/gi, match =>
    match.replace(/\b\w/g, c => c.toUpperCase())
  );
}

function formatForDisplay(text) {
  let t = normalizeWhitespace(text);
  t = capitalizeFirst(t);
  return t;
}

export { normalizeWhitespace, capitalizeFirst, smartCapitalize, formatForDisplay }