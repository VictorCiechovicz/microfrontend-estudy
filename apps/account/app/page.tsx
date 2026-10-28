import Link from "next/link";

export default function AccountPage() {
  return (
    <main>
      <h1>Account</h1>
      <nav aria-label="Account">
        <ul>
          <li>
            <Link href="/orders" prefetch>
              Orders
            </Link>
          </li>
          <li>
            <Link href="/profile">Profile</Link>
          </li>
          <li>
            <Link href="/notifications">Notifications</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
