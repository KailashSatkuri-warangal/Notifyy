import { ActivityHistory } from "@/types";
import { IActivityHistoryRepository } from "@/repositories/interfaces";
import { historyRepo } from "@/repositories";
import { generateId } from "@/lib/utils";

export class ActivityHistoryService {
  constructor(private repo: IActivityHistoryRepository = historyRepo) {}

  async log(params: {
    contactId: string;
    activityType: ActivityHistory["activityType"];
    activityId: string;
    action: ActivityHistory["action"];
    previousData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    reason?: string;
  }): Promise<ActivityHistory> {
    const history: ActivityHistory = {
      id: generateId(),
      contactId: params.contactId,
      activityType: params.activityType,
      activityId: params.activityId,
      action: params.action,
      previousData: params.previousData,
      newData: params.newData,
      reason: params.reason,
      createdAt: new Date().toISOString(),
    };

    return this.repo.create(history);
  }

  async getForContact(contactId: string): Promise<ActivityHistory[]> {
    return this.repo.getByContactId(contactId);
  }

  async getForActivity(activityId: string): Promise<ActivityHistory[]> {
    return this.repo.getByActivityId(activityId);
  }

  async getAll(): Promise<ActivityHistory[]> {
    return this.repo.getAll();
  }
}

export const activityHistoryService = new ActivityHistoryService();
