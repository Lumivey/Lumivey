/** Allow only Vercel/v0 preview hosts supplied by the authenticated v0 API.
 * v0 may return demo-*.vusercontent.net (not just *.v0.app).
 * Never accept an arbitrary caller-provided URL or relax to arbitrary HTTPS hosts.
 */
export function isAllowedV0PreviewUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return ["v0.app", "v0.dev", "vercel.app", "vusercontent.net"].some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}
