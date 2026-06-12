export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...valueParts] = part.trim().split('=');

    if (!key) return acc;

    acc[key] = valueParts.join('=');

    return acc;
  }, {});
}
