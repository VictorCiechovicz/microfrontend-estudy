import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>404</h1>
      <p>Not found</p>
      <Link href="/catalog/pt">Catálogo</Link>
    </main>
  );
}
