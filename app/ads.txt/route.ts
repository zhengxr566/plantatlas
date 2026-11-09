import { ADSENSE_CLIENT } from "@/lib/adsense";

// AdSense 要求的 /ads.txt
export function GET() {
  const body = `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
