import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-en">Plant Atlas World</span>
        <span className="brand-cn">植物谱系世界</span>
      </Link>

      <span className="domain">plantatlasworld.com</span>
    </header>
  );
}