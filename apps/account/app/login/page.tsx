import { listUsers } from "@lab/db";
import { Button } from "@lab/ui";
import { Suspense } from "react";
import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <main>
      <h1>Log in</h1>
      <Suspense fallback={<p>Loading users…</p>}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
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
    <form action={login}>
      <input
        type="hidden"
        name="next"
        value={typeof next === "string" ? next : "/"}
      />
      <fieldset>
        <legend>Choose a user</legend>
        {users.map((user, index) => (
          <label key={user.id}>
            <input
              type="radio"
              name="userId"
              value={user.id}
              defaultChecked={index === 0}
              required
            />
            {user.name}
          </label>
        ))}
      </fieldset>
      <Button type="submit">Log in</Button>
    </form>
  );
}
