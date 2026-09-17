import { describe, it, expect } from "vitest";
import { BackupService } from "../services/BackupService";
import { generateSeedData } from "../seed/demo-data";

describe("BackupService", () => {
  const backupService = new BackupService();

  it("validates valid backup JSON schema", () => {
    const seed = generateSeedData();
    const validJson = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      ...seed,
    });

    const result = backupService.validateBackupSchema(validJson);
    expect(result.isValid).toBe(true);
    expect(result.data?.contacts.length).toBeGreaterThan(0);
  });

  it("rejects invalid JSON", () => {
    const result = backupService.validateBackupSchema("invalid json string {");
    expect(result.isValid).toBe(false);
  });

  it("rejects JSON missing required contacts array", () => {
    const result = backupService.validateBackupSchema(JSON.stringify({ version: 1 }));
    expect(result.isValid).toBe(false);
  });
});
