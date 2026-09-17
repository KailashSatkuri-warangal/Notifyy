import { BackupData } from "@/types";
import { format } from "date-fns";

export class BackupService {
  async exportData(): Promise<string> {
    const res = await fetch("/api/backup");
    if (!res.ok) throw new Error("Failed to export backup data");
    const data = await res.json();
    return JSON.stringify(data, null, 2);
  }

  validateBackupSchema(rawJson: string): { isValid: boolean; error?: string; data?: BackupData } {
    try {
      const data = JSON.parse(rawJson);
      if (!data || typeof data !== "object") {
        return { isValid: false, error: "Invalid JSON format" };
      }
      if (!data.version || !Array.isArray(data.contacts)) {
        return { isValid: false, error: "Missing required Notifyy schema fields" };
      }
      return { isValid: true, data: data as BackupData };
    } catch (e: any) {
      return { isValid: false, error: e.message || "Failed to parse JSON file" };
    }
  }

  async restoreData(data: BackupData, mode: "replace" | "merge"): Promise<void> {
    const res = await fetch("/api/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, mode }),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to restore backup");
  }

  downloadBackupFile(jsonString: string): void {
    const filename = `notifyy-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const backupService = new BackupService();
