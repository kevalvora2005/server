export enum UserRole {
  ADMIN = "admin",
  RESIDENT = "resident",
  SECURITY = "security",
}

export interface UserProps {
  id?: number;
  cognitoSub?: string | null;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  mustResetPassword: boolean;
  preferredLanguage?: string;
  locale?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  public static create(
    props: Omit<UserProps, 'id' | 'isActive' | 'mustResetPassword' | 'createdAt' | 'updatedAt'> & {
      mustResetPassword?: boolean;
      preferredLanguage?: string;
      locale?: string;
    }
  ): User {
    return new User({
      ...props,
      isActive: true,
      mustResetPassword: props.mustResetPassword ?? false,
      preferredLanguage: props.preferredLanguage ?? 'en',
      locale: props.locale ?? 'en-IN',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get cognitoSub(): string | null | undefined {
    return this.props.cognitoSub;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string {
    return this.props.phone;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get mustResetPassword(): boolean {
    return this.props.mustResetPassword;
  }

  get preferredLanguage(): string {
    return this.props.preferredLanguage ?? 'en';
  }

  get locale(): string {
    return this.props.locale ?? 'en-IN';
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) throw new Error("Name cannot be empty");
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updatePhone(phone: string): void {
    this.props.phone = phone;
    this.props.updatedAt = new Date();
  }

  updateLanguageAndLocale(preferredLanguage?: string, locale?: string): void {
    if (preferredLanguage) this.props.preferredLanguage = preferredLanguage;
    if (locale) this.props.locale = locale;
    this.props.updatedAt = new Date();
  }

  requirePasswordReset(): void {
    this.props.mustResetPassword = true;
    this.props.updatedAt = new Date();
  }

  clearPasswordReset(): void {
    this.props.mustResetPassword = false;
    this.props.updatedAt = new Date();
  }

  setCognitoSub(cognitoSub: string): void {
    this.props.cognitoSub = cognitoSub;
    this.props.updatedAt = new Date();
  }

  reactivate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  toResponseObject() {
    return {
      id: this.props.id,
      cognitoSub: this.props.cognitoSub,
      name: this.props.name,
      email: this.props.email,
      phone: this.props.phone,
      role: this.props.role,
      isActive: this.props.isActive,
      mustResetPassword: this.props.mustResetPassword,
      preferredLanguage: this.preferredLanguage,
      locale: this.locale,
      createdAt: this.props.createdAt,
    };
  }
}