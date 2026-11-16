import sanitizeHtml from "sanitize-html";

/** Sanitizes rich text coming from the admin editor before it is stored or rendered. */
export function sanitizeRichText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "img", "hr", "span"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
    },
  });
}

/** Strips all markup from plain-text user input (reviews, messages). */
export const sanitizePlain = (text: string) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
