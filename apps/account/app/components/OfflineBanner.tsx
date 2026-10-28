"use client";

import { useOffline } from "next/offline";

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;
  return (
    <div role="status">
      You are offline. Pending requests will retry once you are back online.
    </div>
  );
}
