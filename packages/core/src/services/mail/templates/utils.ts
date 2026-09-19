import { buildUrl } from '../../../utils/url-builder';

export const BRAND_COLOR = '#1d3d28';
export const BRAND_NAME = 'RabbitHR';
export const SUPPORT_EMAIL = 'hello@rabbithr.co';

const FONT_STACK = 'Arial, Helvetica, sans-serif';
const SERIF_STACK = "Georgia, 'Times New Roman', serif";

export { buildUrl };

export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

export function buildEmailHeader(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1d3d28;">
  <tr>
    <td style="padding:24px 40px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:28px;height:28px;" width="28" height="28">
            <img src="https://rabbithr.co/images/logo-email.png" width="28" height="28" alt="RabbitHR" style="display:block;border-radius:50%;border:0;" />
          </td>
          <td style="padding-left:10px;font-family:${FONT_STACK};font-weight:700;font-size:15px;color:#ffffff;letter-spacing:0.02em;">
            ${BRAND_NAME}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function buildEmailFooter(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eaeee6;">
  <tr>
    <td style="padding:20px 40px;text-align:center;font-family:${FONT_STACK};font-size:11px;color:#8a9e90;line-height:1.7;">
      &copy; ${new Date().getFullYear()} ${BRAND_NAME} &middot; <a href="https://rabbithr.co" style="color:#3a6b49;text-decoration:none;">rabbithr.co</a>
    </td>
  </tr>
</table>`;
}

export function buildEmailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#eaeee6;font-family:${FONT_STACK};color:#1a2a1e;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eaeee6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!--[if mso]><table width="540" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;background-color:#ffffff;border-radius:6px;overflow:hidden;">
          <tr><td>
${content}
          </td></tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildCTAButton(text: string, link: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td align="center" style="background-color:#1d3d28;border-radius:6px;">
      <a href="${link}" style="display:inline-block;padding:14px 36px;font-family:${FONT_STACK};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

export function buildFallbackLink(link: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background-color:#f4f6f1;border-radius:6px;padding:14px 18px;">
      <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">Or copy this link into your browser</p>
      <p style="margin:0;font-family:${FONT_STACK};font-size:11px;color:#3a6b49;word-break:break-all;line-height:1.5;">${link}</p>
    </td>
  </tr>
</table>`;
}

export function buildIconCircle(
  character: string,
  bgColor: string,
  borderColor: string,
  textColor: string = '#1d3d28',
): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="width:56px;height:56px;background-color:${bgColor};border-radius:50%;border:1px solid ${borderColor};text-align:center;vertical-align:middle;font-size:24px;line-height:56px;color:${textColor};" width="56" height="56">
      ${character}
    </td>
  </tr>
</table>`;
}

export function buildDivider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="height:1px;background-color:#e4ede0;font-size:1px;line-height:1px;">&nbsp;</td>
  </tr>
</table>`;
}

export { FONT_STACK, SERIF_STACK };
