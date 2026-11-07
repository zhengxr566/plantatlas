// 输出 JSON-LD 结构化数据；转义 "<"，避免内容中出现 </script> 时破坏页面
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
