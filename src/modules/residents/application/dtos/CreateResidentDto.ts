export interface CreateResidentDto {
  name: string;
  email: string;
  phone: string;
  password?: string;
  apartmentId: number;
  isOwner?: boolean;
  preferredLanguage?: string;
}