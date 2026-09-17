"use client";

import { useEffect } from "react";
import { useDataStore } from "./useDataStore";

export function useKeyboardShortcuts() {
  const { openSearch, openQuickCreate } = useDataStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ctrl+K or Cmd+K: Open Global Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
        return;
      }

      // / : Open search
      if (e.key === "/") {
        e.preventDefault();
        openSearch();
        return;
      }

      // N: New Activity (Meeting / Follow-Up)
      if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openQuickCreate("follow_up");
        return;
      }

      // C: New Contact
      if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openQuickCreate("contact");
        return;
      }

      // M: New Meeting
      if (e.key.toLowerCase() === "m" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openQuickCreate("meeting");
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch, openQuickCreate]);
}
