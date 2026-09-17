export async function initializeSeedDataIfEmpty(): Promise<boolean> {
  // Handled automatically on the server upon workspace creation
  return false;
}

export async function forceReloadDemoData(): Promise<void> {
  const res = await fetch("/api/settings/demo", { method: "POST" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to reload demo data");
  }
}
