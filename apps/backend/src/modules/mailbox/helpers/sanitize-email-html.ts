import { load } from 'cheerio';

const BLOCKED_TAGS = [
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'link',
  'meta',
  'base',
  'svg',
  'math',
  'noscript',
  'template',
  'title',
  'head',
];

const URL_ATTRIBUTES = [
  'href',
  'src',
  'action',
  'formaction',
  'background',
  'poster',
  'xlink:href',
  'srcset',
];

const SAFE_URL = /^(https?:|mailto:|tel:|cid:|#|\/)/i;
const SAFE_IMAGE_DATA = /^data:image\/(png|gif|jpe?g|webp);base64,/i;
const UNSAFE_STYLE =
  /expression\s*\(|javascript:|vbscript:|@import|behavior\s*:/i;

export function sanitizeEmailHtml(html: string | null | undefined) {
  if (!html) return null;
  const $ = load(html);
  $(BLOCKED_TAGS.join(',')).remove();
  $('*').each((_index, element) => {
    if (!('attribs' in element)) return;
    for (const name of Object.keys(element.attribs)) {
      const lower = name.toLowerCase();
      const value = element.attribs[name].trim();
      if (lower.startsWith('on') || lower === 'srcdoc') {
        $(element).removeAttr(name);
        continue;
      }
      if (URL_ATTRIBUTES.includes(lower)) {
        const compact = [...value]
          .filter((char) => char.charCodeAt(0) > 32)
          .join('');
        const allowed =
          SAFE_URL.test(compact) ||
          (lower === 'src' && SAFE_IMAGE_DATA.test(compact));
        if (!allowed || lower === 'srcset') {
          $(element).removeAttr(name);
        }
        continue;
      }
      if (lower === 'style' && UNSAFE_STYLE.test(value)) {
        $(element).removeAttr(name);
      }
    }
  });
  $('a[href]').attr('target', '_blank').attr('rel', 'noopener noreferrer');
  const body = $('body');
  return (body.length ? body.html() : $.html())?.trim() ?? null;
}

export function emailHtmlToText(html: string | null | undefined): string {
  if (!html) return '';
  const $ = load(html);
  $(BLOCKED_TAGS.join(',')).remove();
  $('br').replaceWith('\n');
  $('p, div, tr, li, h1, h2, h3, h4').append('\n');
  return $.root()
    .text()
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

export function buildSnippet(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 3)}...` : flat;
}
