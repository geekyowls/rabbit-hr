const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function textToHtml(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p>${paragraph.replace(/[&<>"']/g, (c) => ESCAPES[c]).replace(/\n/g, '<br />')}</p>`,
    )
    .join('');
}
