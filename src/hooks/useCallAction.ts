"use client";

import { Contact } from "@/types";
import { useDataStore } from "./useDataStore";

export function useCallAction() {
  const { triggerCallPrompt, refreshData } = useDataStore();

  const initiateCall = async (contact: Contact) => {
    if (!contact.mobile) return;

    // 1. Record call interaction in server database
    try {
      await fetch(`/api/contacts/${contact.id}/call`, { method: "POST" });
      refreshData();
    } catch (err) {
      console.error("Failed to record call on server", err);
    }

    // 2. Open native dialer via tel:
    const cleanNumber = contact.mobile.replace(/[^\d+]/g, "");
    window.location.href = `tel:${cleanNumber}`;

    // 3. Set post-call prompt on window focus
    const handleFocus = () => {
      window.removeEventListener("focus", handleFocus);
      setTimeout(() => {
        triggerCallPrompt(contact);
      }, 500);
    };

    window.addEventListener("focus", handleFocus, { once: true });
  };

  return { initiateCall };
}
