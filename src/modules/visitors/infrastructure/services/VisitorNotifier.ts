import { IVisitorNotifier } from "../../domain/services/IVisitorNotifier";
import { Visitor } from "../../domain/entities/Visitor";
import { notificationService } from "../../../notifications/container";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { getIO } from "../../../../shared/socket/socket.server";
import { SOCKET_EVENTS } from "../../../../shared/socket/socket.events";

export class VisitorNotifier implements IVisitorNotifier {
  constructor(private readonly residentRepository: IResidentRepository) {}

  async notifyApprovalNeeded(visitor: Visitor): Promise<void> {
    const userId = await this.resolveUserId(visitor.residentId);
    if (!userId) return;

    await notificationService.notify(
      userId,
      "visitor_approval_needed",
      "Visitor at the gate",
      `${visitor.name} is at the gate for "${visitor.purpose}". Approve or reject entry.`,
      {
        visitorId: visitor.id,
        key: "notification.visitor_gate",
        params: { name: visitor.name, purpose: visitor.purpose },
      }
    );
  }

  async notifyApprovalTimedOut(visitor: Visitor): Promise<void> {
    const userId = await this.resolveUserId(visitor.residentId);
    if (!userId) return;

    await notificationService.notify(
      userId,
      "visitor_approval_timed_out",
      "Visitor request expired",
      `Your approval request for ${visitor.name} timed out and was automatically rejected.`,
      {
        visitorId: visitor.id,
        key: "notification.visitor_timeout",
        params: { name: visitor.name },
      }
    );
  }

  async notifyPreRegisteredCheckedIn(visitor: Visitor): Promise<void> {
    const userId = await this.resolveUserId(visitor.residentId);
    if (!userId) return;

    await notificationService.notify(
      userId,
      "visitor_checked_in",
      "Visitor arrived",
      `${visitor.name} has checked in at the gate.`,
      {
        visitorId: visitor.id,
        key: "notification.visitor_checked_in",
        params: { name: visitor.name },
      }
    );
  }

  async notifyVisitorRejected(visitor: Visitor): Promise<void> {
    const userId = await this.resolveUserId(visitor.residentId);
    if (!userId) return;

    await notificationService.notify(
      userId,
      "visitor_rejected",
      "Visitor Entry Rejected",
      `${visitor.name}'s entry request for "${visitor.purpose}" was rejected.`,
      {
        visitorId: visitor.id,
        status: "Rejected",
        key: "notification.visitor_rejected",
        params: { name: visitor.name, purpose: visitor.purpose },
      }
    );
  }

  async notifyVisitorUpdated(visitor: Visitor, status: string, type?: "pre_registered" | "walk_in"): Promise<void> {
    try {
      getIO().emit(SOCKET_EVENTS.VISITOR_UPDATED, {
        visitorId: visitor.id,
        status,
        type,
      });
    } catch {
      /* socket not initialized */
    }
  }

  private async resolveUserId(residentId: number): Promise<number | null> {
    const resident = await this.residentRepository.findById(residentId);
    return resident?.userId ?? null;
  }
}