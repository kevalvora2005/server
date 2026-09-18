import { INoticeNotifier } from "../../domain/services/notice-notifier.interface";
import { Notice } from "../../domain/entities/Notice";
import { notificationService } from "../../../notifications/container";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";

export class SocketNoticeNotifier implements INoticeNotifier {
  constructor(private readonly residentRepository: IResidentRepository) { }

  async notifyNewNotice(notice: Notice): Promise<void> {
    try {
      const residents = await this.residentRepository.findAllActive();

      await Promise.all(
        residents.map((resident) =>
          notificationService.notify(
            resident.userId,
            "notice_created",
            "New Notice",
            notice.title,
            {
              noticeId: notice.id,
              key: "notification.notice_created",
              params: { title: notice.title },
            }
          )
        )
      );
    } catch (err) {
      console.error("Failed to create notice notifications", err);
    }
  }
}