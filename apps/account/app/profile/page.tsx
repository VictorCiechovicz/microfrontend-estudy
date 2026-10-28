import { Button } from "@lab/ui";
import { Suspense } from "react";
import { getProfile } from "../../lib/data";
import { requireUserId } from "../../lib/session";
import { updateProfileAction } from "./actions";

export default function ProfilePage() {
  return (
    <main>
      <h1>Profile</h1>
      <Suspense fallback={<p aria-busy="true">Loading profile…</p>}>
        <ProfileForm />
      </Suspense>
    </main>
  );
}

async function ProfileForm() {
  const userId = await requireUserId();
  const profile = await getProfile(userId);
  return (
    <form action={updateProfileAction}>
      <label>
        Name <input name="name" defaultValue={profile?.name} required />
      </label>{" "}
      <Button type="submit">Save</Button>
    </form>
  );
}
