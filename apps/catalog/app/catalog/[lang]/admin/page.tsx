import { Suspense } from "react";
import { currentLang } from "../../../../lib/i18n";
import { getSessionUserId } from "../../../../lib/session";
import { PriceForm } from "./PriceForm";

export default function AdminPage() {
  return (
    <main>
      <h1>Price admin</h1>
      <Suspense fallback={<p aria-busy="true">…</p>}>
        <AdminGate />
      </Suspense>
    </main>
  );
}

async function AdminGate() {
  const lang = await currentLang();
  if ((await getSessionUserId()) === null) {
    const next = new URLSearchParams({ next: `/catalog/${lang}/admin` });
    return (
      <p>
        <a href={`/account/login?${next}`}>Log in</a>
      </p>
    );
  }
  return <PriceForm lang={lang} />;
}
