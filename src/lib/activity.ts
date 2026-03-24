import ActivityLog from "@/models/ActivityLog";

export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  await ActivityLog.create({
    userId,
    action,
    entityType,
    entityId,
    metadata,
  });
}
