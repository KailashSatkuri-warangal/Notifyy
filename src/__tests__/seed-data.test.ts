import { describe, it, expect } from "vitest";
import { generateSeedData } from "../seed/demo-data";

describe("Seed Data Generator", () => {
  it("generates populated seed data with Indian and corporate-neutral profiles", () => {
    const seed = generateSeedData();
    expect(seed.contacts.length).toBeGreaterThanOrEqual(8);
    expect(seed.meetings.length).toBeGreaterThanOrEqual(4);
    expect(seed.followUps.length).toBeGreaterThanOrEqual(4);
    expect(seed.notes.length).toBeGreaterThanOrEqual(3);
    expect(seed.history.length).toBeGreaterThanOrEqual(5);

    // Verify contact structure
    const firstContact = seed.contacts[0];
    expect(firstContact.name).toBeTruthy();
    expect(firstContact.mobile).toBeTruthy();
    expect(firstContact.company).toBeTruthy();
  });
});
