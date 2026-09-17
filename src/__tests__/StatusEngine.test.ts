import { describe, it, expect } from "vitest";
import { StatusEngine } from "../services/StatusEngine";
import { format, subDays, addDays } from "date-fns";

describe("StatusEngine", () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const pastDate = format(subDays(new Date(), 2), "yyyy-MM-dd");
  const futureDate = format(addDays(new Date(), 2), "yyyy-MM-dd");

  it("should mark pending past activity as overdue", () => {
    const status = StatusEngine.evaluateStatus(pastDate, "10:00", "pending");
    expect(status).toBe("overdue");
  });

  it("should keep future pending activity as pending", () => {
    const status = StatusEngine.evaluateStatus(futureDate, "10:00", "pending");
    expect(status).toBe("pending");
  });

  it("should preserve completed status even if date is past", () => {
    const status = StatusEngine.evaluateStatus(pastDate, "10:00", "completed");
    expect(status).toBe("completed");
  });

  it("should preserve cancelled status even if date is past", () => {
    const status = StatusEngine.evaluateStatus(pastDate, "10:00", "cancelled");
    expect(status).toBe("cancelled");
  });

  it("should preserve rescheduled status", () => {
    const status = StatusEngine.evaluateStatus(pastDate, "10:00", "rescheduled");
    expect(status).toBe("rescheduled");
  });
});
