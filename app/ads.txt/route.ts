// AdSense 要求的 /ads.txt，发布商 ID 取自 NEXT_PUBLIC_ADSENSE_CLIENT
export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const body = client
    ? `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
