export type BookingStatus = "Pending" | "Confirmed" | "Rejected" | "Cancelled";

export interface BookingResidentInfo {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  preferredLanguage?: string;
  locale?: string;
}

export interface BookingApartmentInfo {
  id: number;
  block: string;
  floorNumber: number;
  unitNumber: string;
  unitFormatted?: string;
}

export interface BookingAmenityInfo {
  id: number;
  name: string;
  price?: number;
  bookingType?: string;
  isSharedCapacity?: boolean;
}

export interface BookingProps {
  id?: number;
  amenityId: number;
  apartmentId: number;
  residentId: number;              // who requested the booking
  bookingDate: string;             // "2026-08-25" — the calendar date
  startTime: string;               // "18:00"
  endTime: string;                 // "19:00"
  memberCount?: number;            // Number of attendees/family members (default: 1)
  purpose?: string | null;
  status?: BookingStatus;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  approvedBySecurityId?: number | null;
  paidAt?: Date | null;
  paymentRef?: string | null;      // UPI ref, only set once paid
  receiptUrl?: string | null;
  resident?: BookingResidentInfo | null;
  apartment?: BookingApartmentInfo | null;
  amenity?: BookingAmenityInfo | null;
  createdAt?: Date;
}

export class Booking {
  readonly id?: number;
  readonly amenityId: number;
  readonly apartmentId: number;
  readonly residentId: number;
  readonly bookingDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly memberCount: number;
  purpose: string | null;
  status: BookingStatus;
  rejectionReason: string | null;
  cancellationReason: string | null;
  approvedBySecurityId: number | null;
  paidAt: Date | null;
  paymentRef: string | null;
  receiptUrl: string | null;
  readonly resident?: BookingResidentInfo | null;
  readonly apartment?: BookingApartmentInfo | null;
  readonly amenity?: BookingAmenityInfo | null;
  readonly createdAt: Date;

  constructor(props: BookingProps) {
    this.id = props.id;
    this.amenityId = props.amenityId;
    this.apartmentId = props.apartmentId;
    this.residentId = props.residentId;
    this.bookingDate = props.bookingDate;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.memberCount = props.memberCount && props.memberCount > 0 ? props.memberCount : 1;
    this.purpose = props.purpose ?? null;
    this.status = props.status ?? "Pending";
    this.rejectionReason = props.rejectionReason ?? null;
    this.cancellationReason = props.cancellationReason ?? null;
    this.approvedBySecurityId = props.approvedBySecurityId ?? null;
    this.paidAt = props.paidAt ?? null;
    this.paymentRef = props.paymentRef ?? null;
    this.receiptUrl = props.receiptUrl ?? null;
    this.resident = props.resident ?? null;
    this.apartment = props.apartment ?? null;
    this.amenity = props.amenity ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: BookingProps): Booking {
    if (props.startTime >= props.endTime) {
      throw new Error("startTime must be before endTime");
    }
    return new Booking({ ...props, status: "Pending" });
  }

  approve(byUserId: number): void {
    this.ensureStatus("Pending", "approve");
    this.status = "Confirmed";
    this.approvedBySecurityId = byUserId;
  }

  reject(reason: string): void {
    this.ensureStatus("Pending", "reject");
    this.status = "Rejected";
    this.rejectionReason = reason;
  }

  cancel(reason: string): void {
    if (this.status !== "Confirmed" && this.status !== "Pending") {
      throw new Error(`Cannot cancel a booking with status ${this.status}`);
    }
    this.status = "Cancelled";
    this.cancellationReason = reason;
  }

  markPaid(paymentRef: string): void {
    if (this.status !== "Confirmed") {
      throw new Error("Only a Confirmed booking can be paid for");
    }
    if (this.isPaid()) {
      throw new Error("Booking is already paid");
    }
    this.paymentRef = paymentRef;
    this.paidAt = new Date();
  }

  setReceiptUrl(url: string): void {
    this.receiptUrl = url;
  }

  isPaid(): boolean {
    return this.paidAt !== null;
  }

  overlapsWith(startTime: string, endTime: string): boolean {
    return this.startTime < endTime && startTime < this.endTime;
  }

  toResponseObject() {
    return {
      id: this.id,
      amenityId: this.amenityId,
      apartmentId: this.apartmentId,
      residentId: this.residentId,
      bookingDate: this.bookingDate,
      startTime: this.startTime,
      endTime: this.endTime,
      memberCount: this.memberCount,
      purpose: this.purpose,
      status: this.status,
      rejectionReason: this.rejectionReason,
      cancellationReason: this.cancellationReason,
      approvedBySecurityId: this.approvedBySecurityId,
      paidAt: this.paidAt,
      paymentRef: this.paymentRef,
      receiptUrl: this.receiptUrl,
      resident: this.resident,
      apartment: this.apartment,
      amenity: this.amenity,
      createdAt: this.createdAt,
    };
  }

  private ensureStatus(expected: BookingStatus, action: string): void {
    if (this.status !== expected) {
      throw new Error(`Cannot ${action} a booking with status ${this.status}`);
    }
  }
}