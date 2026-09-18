export type NotificationType =
  | "complaint_created"
  | "complaint_status_changed"
  | "complaint_comment_added"
  | "notice_created"
  | "maintenance_due_soon"
  | "maintenance_due_today"
  | "maintenance_overdue"
  | "maintenance_overdue_reminder"
  | "maintenance_payment_succeeded"
  | "tenant_request_submitted"
  | "tenant_request_approved"
  | "tenant_request_rejected"
  | "tenancy_revoked"
  | "document_request_created"
  | "document_request_status_changed"
  | "document_request_approved"
  | "document_request_uploaded"
  | "document_request_rejected"
  | "document_request_cancelled"
  | "visitor_approval_needed"
  | "visitor_approval_timed_out"
  | "visitor_checked_in"
  | "visitor_approved"
  | "visitor_rejected"
  | "booking_requested"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_reminder"
  | "booking_payment_succeeded";

export interface NotificationDataMap {
  complaint_created: { complaintId: number };
  complaint_status_changed: { complaintId: number; status: string };
  complaint_comment_added: { complaintId: number };
  notice_created: { noticeId: number };
  document_request_created: { documentRequestId: number };
  document_request_status_changed: { documentRequestId: number; status: string };
  document_request_approved: { documentRequestId: number; status: string };
  document_request_uploaded: { documentRequestId: number; status: string };
  document_request_rejected: { documentRequestId: number; status: string };
  document_request_cancelled: { documentRequestId: number };
  booking_requested: { bookingId: number; amenityId: number };
  booking_confirmed: { bookingId: number; amenityId: number };
  booking_rejected: { bookingId: number; amenityId: number };
  booking_cancelled: { bookingId: number; amenityId: number };
  booking_reminder: { bookingId: number; amenityId: number };
  booking_payment_succeeded: { bookingId: number; amenityId: number };
}

export interface NotificationProps {
  id?: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  messageKey?: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export class Notification {
  private props: NotificationProps;

  constructor(props: NotificationProps) {
    this.props = props;
  }

  public static create(
    props: Omit<NotificationProps, "id" | "isRead" | "createdAt">
  ): Notification {
    return new Notification({
      ...props,
      messageKey: props.messageKey || (props.data?.key as string) || (props.data?.messageKey as string) || undefined,
      isRead: false,
      createdAt: new Date(),
    });
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get messageKey(): string | undefined {
    return this.props.messageKey || (this.props.data?.key as string) || (this.props.data?.messageKey as string);
  }

  get data(): Record<string, unknown> {
    return this.props.data;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markAsRead(): void {
    this.props.isRead = true;
  }

  toResponseObject() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      type: this.props.type,
      title: this.props.title,
      body: this.props.body,
      messageKey: this.messageKey,
      data: this.props.data,
      isRead: this.props.isRead,
      createdAt: this.props.createdAt,
    };
  }
}