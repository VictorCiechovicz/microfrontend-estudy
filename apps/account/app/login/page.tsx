import { listUsers } from "@lab/db";
import { Button, Card, PageHeader, Skeleton, StudyNote } from "@lab/ui";
import { Suspense } from "react";
import styles from "../components/account.module.css";
import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <main>
      <div className={styles.narrow}>
        <PageHeader
          eyebrow="Zona conta"
          title="Entrar"
          lead="Não há senha: escolha um dos usuários de teste. A sessão vale para todas as zonas."
        />
        <StudyNote
          className={styles.studyNote}
          notes={["proxy", "multi-zones"]}
        >
          <p>
            Chegou aqui vindo de outra página da conta? Foi o{" "}
            <code>proxy.ts</code> da conta: sem cookie <code>lab_user</code>{" "}
            válido, ele responde 307 para{" "}
            <code>/login?next=&lt;caminho&gt;</code> (veja na aba Network).
          </p>
          <p>
            Ao entrar, uma Server Action grava o cookie e volta para o{" "}
            <code>next</code>. O cookie vale para as três zonas porque todas são
            servidas pela mesma origem, <code>localhost:3000</code>.
          </p>
        </StudyNote>
        <Suspense fallback={<Skeleton label="Carregando usuários…" />}>
          <LoginForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const users = listUsers();
  return (
    <Card>
      <form action={login} className={styles.loginForm}>
        <input
          type="hidden"
          name="next"
          value={typeof next === "string" ? next : "/"}
        />
        <fieldset>
          <legend>Escolha um usuário</legend>
          <div className={styles.userGrid}>
            {users.map((user, index) => (
              <label key={user.id} className={styles.userOption}>
                <input
                  type="radio"
                  name="userId"
                  value={user.id}
                  defaultChecked={index === 0}
                  required
                />
                <span className={styles.userAvatar} aria-hidden="true">
                  {user.name.slice(0, 1)}
                </span>
                <span className={styles.userName}>{user.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" size="lg">
          Entrar
        </Button>
      </form>
    </Card>
  );
}
