import { ActivityStatus } from "@/types";
import { parseActivityDateTime, isPastActivity } from "@/lib/date-utils";

export class StatusEngine {
  /**
   * Determine the live status of an activity.
   * If an activity is marked "pending" and the scheduled date/time is in the past,
   * it is dynamically evaluated as "overdue".
   */
  static evaluateStatus(date: string, time: string, currentStatus: ActivityStatus): ActivityStatus {
    if (currentStatus === "completed" || currentStatus === "cancelled" || currentStatus === "rescheduled") {
      return currentStatus;
    }

    if (isPastActivity(date, time)) {
      return "overdue";
    }

    return "pending";
  }

  static isOverdue(date: string, time: string, status: ActivityStatus): boolean {
    return this.evaluateStatus(date, time, status) === "overdue";
  }
}
