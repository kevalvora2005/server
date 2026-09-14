
import { UserModel } from "../../src/modules/auth/infrastructure/models/UserModel";
import { ResidentModel } from "../../src/modules/residents/infrastructure/models/ResidentModel";
import { ApartmentModel } from "../../src/modules/apartments/infrastructure/models/ApartmentModel";
import { VehicleModel } from "../../src/modules/vehicles/infrastructure/models/VehicleModel";
import { UserRole } from "../../src/modules/auth/domain/entities/User";
import { ApartmentType } from "../../src/modules/apartments/domain/entities/Apartment";
import { VehicleType, FuelType } from "../../src/modules/vehicles/domain/entities/Vehicle";
import { FamilyMemberModel } from "../../src/modules/family-members/infrastructure/models/FamilyMemberModel";
import { NoticeModel } from "../../src/modules/notices/infrastructure/models/NoticeModel";
import { NoticeCategory } from "../../src/modules/notices/domain/entities/Notice";
import { ComplaintModel } from "../../src/modules/complaints/infrastructure/models/ComplaintModel";
import { ComplaintCommentModel } from "../../src/modules/complaints/infrastructure/models/ComplaintCommentModel";
import { ComplaintPriority, ComplaintStatus } from "../../src/modules/complaints/domain/entities/Complaint";
import { ComplaintImageModel } from "../../src/modules/complaints/infrastructure/models/ComplaintImageModel";
import { MaintenanceSettingModel } from "../../src/modules/maintenance/infrastructure/models/MaintenanceSettingModel";
import { InvoiceModel } from "../../src/modules/maintenance/infrastructure/models/InvoiceModel";
import { InvoiceStatus } from "../../src/modules/maintenance/domain/entities/Invoice";
import { AmenityModel } from "../../src/modules/amenities/infrastructure/models/AmenityModel";
import { AmenityBookingType } from "../../src/modules/amenities/domain/entities/Amenity";
import { CognitoAuthService } from "../../src/modules/auth/infrastructure/services/CognitoAuthService";

const apartments = [
  { block: "A", floorNumber: 1, unitNumber: "01", areaSqft: 850, type: ApartmentType.ONE_BHK },
  { block: "A", floorNumber: 1, unitNumber: "02", areaSqft: 1100, type: ApartmentType.TWO_BHK },
  { block: "A", floorNumber: 2, unitNumber: "01", areaSqft: 1250, type: ApartmentType.TWO_BHK },
  { block: "A", floorNumber: 2, unitNumber: "02", areaSqft: 1500, type: ApartmentType.THREE_BHK },
  { block: "B", floorNumber: 1, unitNumber: "01", areaSqft: 600, type: ApartmentType.ONE_BHK },
  { block: "B", floorNumber: 1, unitNumber: "02", areaSqft: 850, type: ApartmentType.ONE_BHK },
  { block: "B", floorNumber: 2, unitNumber: "01", areaSqft: 1100, type: ApartmentType.TWO_BHK },
  { block: "B", floorNumber: 3, unitNumber: "01", areaSqft: 1800, type: ApartmentType.FOUR_BHK },
  { block: "C", floorNumber: 1, unitNumber: "01", areaSqft: 950, type: ApartmentType.ONE_BHK },
  { block: "C", floorNumber: 2, unitNumber: "01", areaSqft: 1350, type: ApartmentType.THREE_BHK },
];

const residents = [
  { name: "Rahul Sharma", email: "rahul@yopmail.com", phone: "9876543210", isCommitteeMember: true },
  { name: "Priya Patel", email: "priya@yopmail.com", phone: "9876543211", isCommitteeMember: true },
  { name: "Amit Joshi", email: "amit@yopmail.com", phone: "9876543212", isCommitteeMember: true },
  { name: "Neha Singh", email: "neha@yopmail.com", phone: "9876543213" },
  { name: "Ravi Kumar", email: "ravi@yopmail.com", phone: "9876543214" },
  { name: "Sunita Mehta", email: "sunita@yopmail.com", phone: "9876543215" },
  { name: "Vikram Desai", email: "vikram@yopmail.com", phone: "9876543216" },
  { name: "Anjali Gupta", email: "anjali@yopmail.com", phone: "9876543217" },
  { name: "Karan Malhotra", email: "karan@yopmail.com", phone: "9876543218" },
  { name: "Deepa Nair", email: "deepa@yopmail.com", phone: "9876543219" },
];

const familyMembers = [
  { residentEmail: "rahul@yopmail.com", name: "Pooja Sharma", relation: "Spouse", age: 30 },
  { residentEmail: "rahul@yopmail.com", name: "Aarav Sharma", relation: "Child", age: 5 },

  { residentEmail: "priya@yopmail.com", name: "Kunal Patel", relation: "Spouse", age: 33 },
  { residentEmail: "priya@yopmail.com", name: "Riya Patel", relation: "Child", age: 7 },

  { residentEmail: "amit@yopmail.com", name: "Suresh Joshi", relation: "Parent", age: 63 },
  { residentEmail: "amit@yopmail.com", name: "Meena Joshi", relation: "Parent", age: 59 },

  { residentEmail: "neha@yopmail.com", name: "Ankit Singh", relation: "Sibling", age: 29 },

  { residentEmail: "ravi@yopmail.com", name: "Sneha Kumar", relation: "Spouse", age: 31 },
  { residentEmail: "ravi@yopmail.com", name: "Vivaan Kumar", relation: "Child", age: 3 },

  { residentEmail: "sunita@yopmail.com", name: "Harish Mehta", relation: "Spouse", age: 38 },
  { residentEmail: "sunita@yopmail.com", name: "Rohan Mehta", relation: "Child", age: 10 },

  { residentEmail: "vikram@yopmail.com", name: "Kokila Desai", relation: "Parent", age: 61 },

  { residentEmail: "anjali@yopmail.com", name: "Nikhil Gupta", relation: "Sibling", age: 27 },
];

const vehicles = [
  { residentEmail: "rahul@yopmail.com", plateNumber: "GJ01AB1234", type: VehicleType.CAR, brandName: "Honda", model: "City", color: "White", fuelType: FuelType.PETROL },
  { residentEmail: "priya@yopmail.com", plateNumber: "GJ02CD5678", type: VehicleType.CAR, brandName: "Maruti", model: "Swift", color: "Red", fuelType: FuelType.PETROL },
  { residentEmail: "amit@yopmail.com", plateNumber: "GJ03EF9012", type: VehicleType.BIKE, brandName: "Royal Enfield", model: "Classic 350", color: "Black", fuelType: FuelType.PETROL },
  { residentEmail: "neha@yopmail.com", plateNumber: "GJ04GH3456", type: VehicleType.SCOOTER, brandName: "Honda", model: "Activa 6G", color: "Blue", fuelType: FuelType.PETROL },
  { residentEmail: "ravi@yopmail.com", plateNumber: "GJ05IJ7890", type: VehicleType.CAR, brandName: "Hyundai", model: "Creta", color: "Silver", fuelType: FuelType.DIESEL },
  { residentEmail: "sunita@yopmail.com", plateNumber: "GJ06KL1234", type: VehicleType.SCOOTER, brandName: "TVS", model: "Jupiter", color: "Green", fuelType: FuelType.PETROL },
  { residentEmail: "vikram@yopmail.com", plateNumber: "GJ07MN5678", type: VehicleType.CAR, brandName: "Toyota", model: "Fortuner", color: "White", fuelType: FuelType.DIESEL },
  { residentEmail: "anjali@yopmail.com", plateNumber: "GJ08OP9012", type: VehicleType.BIKE, brandName: "Bajaj", model: "Pulsar NS200", color: "Orange", fuelType: FuelType.PETROL },
  { residentEmail: "rahul@yopmail.com", plateNumber: "GJ09QR3456", type: VehicleType.BIKE, brandName: "KTM", model: "Duke 390", color: "Black", fuelType: FuelType.PETROL },
  { residentEmail: "priya@yopmail.com", plateNumber: "GJ10ST7890", type: VehicleType.CAR, brandName: "Tata", model: "Nexon EV", color: "Teal", fuelType: FuelType.ELECTRIC },
];

const seedDefaultUsers = async (): Promise<void> => {
  try {
    const cognitoAuthService = new CognitoAuthService();

    const users = [
      {
        name: "System Administrator",
        email: "admin@yopmail.com",
        password: "Admin@123",
        phone: "+910000000000",
        role: UserRole.ADMIN,
      },
      {
        name: "Security Guard",
        email: "security@yopmail.com",
        password: "Security@123",
        phone: "+910000000002",
        role: UserRole.SECURITY,
      },
    ];

    for (const user of users) {
      let cognitoSub: string | null = null;
      try {
        cognitoSub = await cognitoAuthService.adminCreateUser(
          user.email,
          user.name,
          user.phone,
          user.role,
          user.password
        );
        try {
          await cognitoAuthService.adminSetUserPassword(user.email, user.password);
        } catch {
        }
      } catch (error: any) {
        cognitoSub = await cognitoAuthService.adminGetUser(user.email);
        if (!cognitoSub) {
          try {
            const tokens = await cognitoAuthService.login(user.email, user.password);
            const payload = JSON.parse(Buffer.from(tokens.idToken.split(".")[1], "base64").toString());
            cognitoSub = payload.sub || null;
          } catch (err) {
            console.error(`[Database Seeder]: Failed to resolve Cognito user for ${user.email}:`, err);
          }
        }
      }

      const existingUser = await UserModel.findOne({ where: { email: user.email } });
      if (existingUser) {
        if ((!existingUser.cognitoSub && cognitoSub) || existingUser.phone !== user.phone) {
          await existingUser.update({
            cognitoSub: cognitoSub || existingUser.cognitoSub,
            phone: user.phone,
          });
          console.log(`[Database Seeder]: Linked cognitoSub (${cognitoSub}) for ${user.email}`);
        }
        continue;
      }

      await UserModel.create({
        cognitoSub,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: true,
      });
      console.log(`[Database Seeder]: Created ${user.role} — ${user.email} (sub: ${cognitoSub})`);
    }

    console.log("[Database Seeder]: Default users successfully seeded!");

  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed default users:", error);
  }
};

const seedApartments = async (): Promise<void> => {
  try {
    const existingApartments = await ApartmentModel.count();
    if (existingApartments > 0) {
      console.log("[Database Seeder]: Apartments already seeded. Skipping.");
    } else {
      console.log("[Database Seeder]: Seeding apartments...");
      const createdApartments = await ApartmentModel.bulkCreate(apartments);
      console.log(`[Database Seeder]: ${createdApartments.length} apartments created.`);
    }
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed apartments:", error);
  }
};

const seedResidents = async (): Promise<void> => {
  try {
    const existingResidents = await ResidentModel.count();
    if (existingResidents > 3) {
      console.log("[Database Seeder]: Residents already seeded. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Seeding resident users...");

    const allApartments = await ApartmentModel.findAll({
      attributes: ["id"],
      order: [["id", "ASC"]],
    });

    for (let i = 0; i < residents.length; i++) {
      const r = residents[i];

      const existing = await UserModel.findOne({ where: { email: r.email } });
      if (existing) continue;

      const user = await UserModel.create({
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: UserRole.RESIDENT,
        isActive: true,
      });

      const apartment = allApartments[i];

      const month = String((i % 12) + 1).padStart(2, '0');

      await ResidentModel.create({
        userId: user.id,
        apartmentId: apartment.id,
        isOwner: true,
        isCommitteeMember: r.isCommitteeMember ?? false,
        moveInDate: new Date(`2024-${month}-01`),
        isActive: true,
      });

      console.log(`[Database Seeder]: Created resident — ${r.email}`);
    }

    console.log("[Database Seeder]: Residents seeded successfully!");

  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed residents:", error);
  }
};

const seedCommitteeMembers = async (): Promise<void> => {
  try {
    const committeeEmails = residents
      .filter((r) => r.isCommitteeMember)
      .map((r) => r.email);

    if (committeeEmails.length === 0) {
      console.log("[Database Seeder]: No committee members defined. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Marking committee members...");

    for (const email of committeeEmails) {
      const user = await UserModel.findOne({ where: { email } });
      if (!user) {
        console.log(`[Database Seeder]: User ${email} not found. Skipping committee flag.`);
        continue;
      }

      const resident = await ResidentModel.findOne({ where: { userId: user.id } });
      if (!resident) {
        console.log(`[Database Seeder]: Resident profile for ${email} not found.`);
        continue;
      }

      if (!resident.isCommitteeMember) {
        await resident.update({ isCommitteeMember: true });
        console.log(`[Database Seeder]: Marked ${email} as committee member.`);
      }
    }

    console.log("[Database Seeder]: Committee members updated.");
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed committee members:", error);
  }
};

const seedFamilyMembers = async (): Promise<void> => {
  try {
    const existing = await FamilyMemberModel.count();

    if (existing > 0) {
      console.log("[Database Seeder]: Family members already seeded. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Seeding family members...");

    for (const member of familyMembers) {
      const user = await UserModel.findOne({
        where: { email: member.residentEmail },
      });

      if (!user) {
        console.log(
          `[Database Seeder]: User ${member.residentEmail} not found. Skipping ${member.name}.`
        );
        continue;
      }

      const resident = await ResidentModel.findOne({
        where: { userId: user.id },
      });

      if (!resident) {
        console.log(
          `[Database Seeder]: Resident profile for ${member.residentEmail} not found.`
        );
        continue;
      }

      await FamilyMemberModel.create({
        residentId: resident.id,
        name: member.name,
        relation: member.relation,
        age: member.age,
      });

      console.log(
        `[Database Seeder]: Created family member ${member.name} for ${member.residentEmail}`
      );
    }

    console.log("[Database Seeder]: Family members seeded successfully!");
  } catch (error) {
    console.error(
      "[Database Seeder] CRITICAL: Failed to seed family members:",
      error
    );
  }
};

const seedVehicles = async (): Promise<void> => {
  try {
    const existingVehicles = await VehicleModel.count();
    if (existingVehicles > 0) {
      console.log("[Database Seeder]: Vehicles already seeded. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Seeding vehicles...");

    for (const v of vehicles) {
      const user = await UserModel.findOne({ where: { email: v.residentEmail } });
      if (!user) {
        console.log(`[Database Seeder]: User ${v.residentEmail} not found. Skipping vehicle ${v.plateNumber}.`);
        continue;
      }

      const resident = await ResidentModel.findOne({ where: { userId: user.id } });
      if (!resident) {
        console.log(`[Database Seeder]: Resident profile for ${v.residentEmail} not found. Skipping vehicle ${v.plateNumber}.`);
        continue;
      }

      await VehicleModel.create({
        residentId: resident.id,
        plateNumber: v.plateNumber,
        type: v.type,
        brandName: v.brandName,
        model: v.model,
        color: v.color,
        fuelType: v.fuelType,
        isActive: true,
      });

      console.log(`[Database Seeder]: Created vehicle ${v.plateNumber} for ${v.residentEmail}`);
    }

    console.log("[Database Seeder]: Vehicles seeded successfully!");

  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed vehicles:", error);
  }
};

const notices = [
  {
    title: "Annual Maintenance Notice",
    body: "The society's annual maintenance is scheduled for June 15th. All residents are requested to cooperate with the maintenance team. Water supply will be affected between 10 AM and 4 PM on that day.",
    category: NoticeCategory.MAINTENANCE,
    isPinned: true,
  },
  {
    title: "Diwali Celebration - Save the Date",
    body: "We are pleased to announce the Diwali celebration event on November 10th in the society clubhouse. There will be a lamp-lighting ceremony, cultural performances, and dinner. Please register your participation at the security desk by November 5th.",
    category: NoticeCategory.EVENT,
    isPinned: true,
  },
  {
    title: "Emergency Generator Test",
    body: "The emergency generator will be tested on the first Saturday of every month between 2 PM and 3 PM. During this time, there may be a brief power interruption lasting no more than 5 minutes. We apologize for any inconvenience.",
    category: NoticeCategory.EMERGENCY,
    isPinned: false,
  },
  {
    title: "Waste Segregation Guidelines",
    body: "As per the new municipal regulations, all residents are requested to segregate waste into wet, dry, and hazardous categories. Green bins are for wet waste, blue bins for dry waste. Please ensure compliance to avoid penalties to the society.",
    category: NoticeCategory.GENERAL,
    isPinned: false,
  },
  {
    title: "Clubhouse Booking Policy Updated",
    body: "The clubhouse booking policy has been updated. Residents can now book the clubhouse for a maximum of 4 hours per slot. A refundable security deposit of ₹5,000 is required at the time of booking. Please refer to the notice board for the full policy document.",
    category: NoticeCategory.GENERAL,
    isPinned: false,
  },
  {
    title: "Rainwater Harvesting System Maintenance",
    body: "The rainwater harvesting system will undergo annual maintenance from July 10th to July 12th. Please ensure that terrace access is clear and that no construction debris is present near the rainwater inlets.",
    category: NoticeCategory.MAINTENANCE,
    isPinned: false,
  },
  {
    title: "Yoga & Wellness Camp",
    body: "A free yoga and wellness camp will be organized in the society garden every Sunday morning from 6 AM to 7 AM starting next month. Certified yoga instructors will guide the sessions. All age groups are welcome. Please bring your own yoga mats.",
    category: NoticeCategory.EVENT,
    isPinned: false,
  },
  {
    title: "Fire Safety Drill",
    body: "A mandatory fire safety drill will be conducted on March 20th at 11 AM. All residents must participate. The drill will include evacuation procedures, fire extinguisher usage demonstration, and emergency assembly point briefing.",
    category: NoticeCategory.EMERGENCY,
    isPinned: true,
  },
];

const seedNotices = async (): Promise<void> => {
  try {
    const existingNotices = await NoticeModel.count();
    if (existingNotices > 0) {
      console.log("[Database Seeder]: Notices already seeded. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Seeding notices...");

    const adminUser = await UserModel.findOne({
      where: { email: "admin@yopmail.com" },
    });

    if (!adminUser) {
      console.log("[Database Seeder]: Admin user not found. Skipping notice seeding.");
      return;
    }

    for (const n of notices) {
      await NoticeModel.create({
        adminId: adminUser.id,
        title: n.title,
        body: n.body,
        category: n.category,
        isPinned: n.isPinned,
        isActive: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[Database Seeder]: Created notice — "${n.title}"`);
    }

    console.log("[Database Seeder]: Notices seeded successfully!");
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed notices:", error);
  }
};

const complaints = [
  {
    residentEmail: "rahul.sharma@yopmail.com",
    title: "Water leakage from bathroom ceiling",
    description: "There is a persistent water leak from the bathroom ceiling since last 3 days. The upstairs neighbor's plumbing may be damaged. The drip has worsened and tiles are starting to stain.",
    priority: ComplaintPriority.HIGH,
    status: ComplaintStatus.IN_PROGRESS,
    daysAgo: 7,
    resolvedDaysAgo: null,
    imageUrls: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    residentEmail: "priya.patel@yopmail.com",
    title: "Broken street light near Block B entrance",
    description: "The street light near the Block B main entrance has been broken for over a week. It gets very dark at night and is a safety concern for residents walking their dogs or returning late.",
    priority: ComplaintPriority.LOW,
    status: ComplaintStatus.OPEN,
    daysAgo: 5,
    resolvedDaysAgo: null,
    imageUrls: [
      "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    residentEmail: "amit.joshi@yopmail.com",
    title: "Noise complaint — late night parties in Block A",
    description: "Residents on the 3rd floor of Block A have been hosting loud parties until 2 AM regularly. This is disturbing the peace, especially for elderly residents and young children. Request strict action.",
    priority: ComplaintPriority.MEDIUM,
    status: ComplaintStatus.OPEN,
    daysAgo: 3,
    resolvedDaysAgo: null,
    imageUrls: []
  },
  {
    residentEmail: "neha.singh@yopmail.com",
    title: "Improper garbage disposal in common area",
    description: "Some residents are leaving garbage bags near the Block C staircase instead of the designated disposal area. This is attracting stray animals and creating unhygienic conditions.",
    priority: ComplaintPriority.LOW,
    status: ComplaintStatus.RESOLVED,
    daysAgo: 20,
    resolvedDaysAgo: 16,
    imageUrls: [
      "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    residentEmail: "ravi.kumar@yopmail.com",
    title: "Lift not working properly — gets stuck between floors",
    description: "The passenger lift in Block A has been malfunctioning for the past 2 days. It jerks suddenly and got stuck between the 1st and 2nd floor yesterday with my family inside. Needs urgent servicing.",
    priority: ComplaintPriority.HIGH,
    status: ComplaintStatus.IN_PROGRESS,
    daysAgo: 4,
    resolvedDaysAgo: null,
    imageUrls: [
      "https://images.unsplash.com/photo-1549479634-11f422998637?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    residentEmail: "sunita.mehta@yopmail.com",
    title: "Security gate remote not functioning",
    description: "The remote for the main security gate has stopped working. The battery was replaced but it still does not respond. Request a replacement or repair at the earliest.",
    priority: ComplaintPriority.MEDIUM,
    status: ComplaintStatus.RESOLVED,
    daysAgo: 14,
    resolvedDaysAgo: 11,
    imageUrls: []
  },
  {
    residentEmail: "anand.deshmukh@yopmail.com",
    title: "Parking space occupied by unauthorized vehicle",
    description: "A white Honda City with plate number GJ05IJ7890 has been parked in my allotted parking space (A-201) for the last 3 days. The vehicle does not belong to any resident in Block A.",
    priority: ComplaintPriority.MEDIUM,
    status: ComplaintStatus.OPEN,
    daysAgo: 2,
    resolvedDaysAgo: null,
    imageUrls: [
      "https://images.unsplash.com/photo-1506521788723-8681500d4ba4?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    residentEmail: "anjali.agarwal@yopmail.com",
    title: "Pest control required in Block C basement",
    description: "There is a severe cockroach and rodent infestation in the Block C basement area near the storage units. Regular pest control has not been conducted this month. Please schedule fumigation urgently.",
    priority: ComplaintPriority.LOW,
    status: ComplaintStatus.OPEN,
    daysAgo: 1,
    resolvedDaysAgo: null,
    imageUrls: []
  }
];

const seedComplaints = async (): Promise<void> => {
  try {
    const existing = await ComplaintModel.count();
    if (existing > 0) {
      console.log("[Database Seeder]: Complaints already seeded. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Seeding complaints...");

    for (const c of complaints) {
      const user = await UserModel.findOne({ where: { email: c.residentEmail } });
      if (!user) {
        console.log(`[Database Seeder]: User ${c.residentEmail} not found. Skipping complaint.`);
        continue;
      }

      const resident = await ResidentModel.findOne({ where: { userId: user.id } });
      if (!resident) {
        console.log(`[Database Seeder]: Resident profile for ${c.residentEmail} not found. Skipping complaint.`);
        continue;
      }

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - c.daysAgo);

      const resolvedAt = c.resolvedDaysAgo !== null
        ? (() => { const d = new Date(); d.setDate(d.getDate() - c.resolvedDaysAgo); return d; })()
        : undefined;

      const created = await ComplaintModel.create({
        residentId: resident.id,
        title: c.title,
        description: c.description,
        priority: c.priority,
        status: c.status,
        createdAt,
        updatedAt: createdAt,
        ...(resolvedAt !== undefined && { resolvedAt }),
      });

      if (c.imageUrls && c.imageUrls.length > 0) {
        for (const url of c.imageUrls) {
          await ComplaintImageModel.create({
            complaintId: created.id,
            imageUrl: url,
            createdAt,
          });
        }
      }

      console.log(`[Database Seeder]: Created complaint — "${c.title}" (${c.residentEmail})`);
    }

    console.log("[Database Seeder]: Complaints seeded successfully!");
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed complaints:", error);
  }
};

const seedComplaintComments = async (): Promise<void> => {
  try {
    const existing = await ComplaintCommentModel.count();
    if (existing > 0) {
      console.log("[Database Seeder]: Complaint comments already seeded. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Seeding complaint comments...");

    const admin = await UserModel.findOne({ where: { email: "admin@yopmail.com" } });
    if (!admin) {
      console.log("[Database Seeder]: Admin user not found. Skipping complaint comments.");
      return;
    }

    const allComplaints = await ComplaintModel.findAll({ order: [["id", "ASC"]] });

    const commentsByComplaint: { complaintIndex: number; userId: "admin" | "resident"; content: string; daysAgo: number }[][] = [
      // Complaint 1: Water leakage (In Progress) — admin responded, resident replied
      [
        { complaintIndex: 0, userId: "admin", content: "We have registered your complaint. A plumber will be sent to inspect the issue tomorrow morning between 9 AM and 11 AM. Please ensure someone is home.", daysAgo: 5 },
        { complaintIndex: 0, userId: "resident", content: "Thank you. The plumber visited and identified a leak from the upstairs bathroom pipe. He has fixed it temporarily but said permanent repair is needed. Please follow up.", daysAgo: 3 },
        { complaintIndex: 0, userId: "admin", content: "Noted. We have escalated this to the maintenance team. The permanent repair will be completed within 2 working days. Apologies for the inconvenience.", daysAgo: 2 },
      ],
      // Complaint 3: Noise complaint (Open) — admin warning issued
      [
        { complaintIndex: 2, userId: "admin", content: "We have spoken to the residents on the 3rd floor and issued a formal warning. Security has been instructed to monitor the situation. Please report if it continues.", daysAgo: 1 },
      ],
      // Complaint 5: Lift issue (In Progress) — admin update, resident follow-up
      [
        { complaintIndex: 4, userId: "admin", content: "The lift servicing company has been contacted. A technician will arrive by tomorrow evening to inspect and repair the issue. We have temporarily shut down the lift for safety.", daysAgo: 3 },
        { complaintIndex: 4, userId: "resident", content: "The technician came but the issue persists. The lift is still jerking when moving between floors. Please send someone again urgently as elderly residents are struggling with stairs.", daysAgo: 1 },
      ],
    ];

    for (const commentGroup of commentsByComplaint) {
      const complaint = allComplaints[commentGroup[0].complaintIndex];
      if (!complaint) continue;

      const residentUser = await UserModel.findOne({
        where: { email: complaints[commentGroup[0].complaintIndex].residentEmail },
      });

      if (!residentUser) continue;

      for (const comment of commentGroup) {
        const userId = comment.userId === "admin" ? admin.id : residentUser.id;

        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - comment.daysAgo);

        await ComplaintCommentModel.create({
          complaintId: complaint.id,
          userId,
          content: comment.content,
          createdAt,
        });

        const by = comment.userId === "admin" ? "Admin" : "Resident";
        console.log(`[Database Seeder]: Created comment on complaint #${complaint.id} (by ${by})`);
      }
    }

    console.log("[Database Seeder]: Complaint comments seeded successfully!");
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed complaint comments:", error);
  }
};

const complaintImageSets = [
  // Complaint 1: Water leakage
  [
    "https://placehold.co/600x400/E8F5E9/2E7D32?text=Ceiling+Leak+1",
    "https://placehold.co/600x400/FFF3E0/E65100?text=Water+Stain",
    "https://placehold.co/600x400/FCE4EC/C62828?text=Drip+Area",
    "https://placehold.co/600x400/E3F2FD/1565C0?text=Tile+Damage",
  ],
  // Complaint 2: Broken street light
  [
    "https://placehold.co/600x400/FFF8E1/F57F17?text=Broken+Light",
    "https://placehold.co/600x400/E8F5E9/2E7D32?text=Dark+Entrance",
  ],
  // Complaint 3: Noise complaint (no images — just text complaint)
  [
    "https://placehold.co/600x400/F3E5F5/6A1B9A?text=Noise+Source",
  ],
  // Complaint 4: Improper garbage disposal
  [
    "https://placehold.co/600x400/EFEBE9/4E342E?text=Garbage+Area+1",
    "https://placehold.co/600x400/FBEDC8/795548?text=Garbage+Area+2",
    "https://placehold.co/600x400/E8EAF6/283593?text=Staircase+View",
  ],
  // Complaint 5: Lift not working
  [
    "https://placehold.co/600x400/FFEBEE/B71C1C?text=Lift+Panel",
    "https://placehold.co/600x400/F5F5F5/212121?text=Stuck+Floor",
    "https://placehold.co/600x400/E1F5FE/0277BD?text=Lift+Display",
    "https://placehold.co/600x400/FCE4EC/C62828?text=Warning+Sign",
    "https://placehold.co/600x400/F9FBE7/827717?text=Service+Tag",
  ],
  // Complaint 6: Security gate remote
  [
    "https://placehold.co/600x400/E0F2F1/00695C?text=Gate+Remote",
    "https://placehold.co/600x400/FFF8E1/F57F17?text=Gate+Panel",
  ],
  // Complaint 7: Parking space occupied
  [
    "https://placehold.co/600x400/E8EAF6/283593?text=Parking+Spot",
    "https://placehold.co/600x400/F5F5F5/212121?text=Unauthorized+Car",
    "https://placehold.co/600x400/FFEBEE/B71C1C?text=Plate+Number",
  ],
  // Complaint 8: Pest control
  [
    "https://placehold.co/600x400/EFEBE9/3E2723?text=Basement+Area+1",
    "https://placehold.co/600x400/ECEFF1/37474F?text=Pest+Infestation",
    "https://placehold.co/600x400/FCE4EC/C62828?text=Storage+Unit",
  ],
];

const seedComplaintImages = async (): Promise<void> => {
  try {
    const existing = await ComplaintImageModel.count();
    if (existing > 0) {
      console.log("[Database Seeder]: Complaint images already seeded. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Seeding complaint images...");

    const allComplaints = await ComplaintModel.findAll({ order: [["id", "ASC"]] });

    for (let i = 0; i < allComplaints.length; i++) {
      const complaint = allComplaints[i];
      const images = complaintImageSets[i] ?? [];

      for (let j = 0; j < images.length; j++) {
        const createdAt = new Date(complaint.createdAt);
        createdAt.setHours(createdAt.getHours() + j);

        await ComplaintImageModel.create({
          complaintId: complaint.id,
          imageUrl: images[j],
          createdAt,
        });
      }

      console.log(`[Database Seeder]: Added ${images.length} image(s) to complaint #${complaint.id}`);
    }

    console.log("[Database Seeder]: Complaint images seeded successfully!");
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed complaint images:", error);
  }
};

const seedMaintenanceSetting = async (): Promise<void> => {
  try {
    const existing = await MaintenanceSettingModel.count();
    if (existing > 0) {
      console.log("[Database Seeder]: Maintenance setting already exists. Skipping.");
      return;
    }

    await MaintenanceSettingModel.create({ amount: 1500 });
    console.log("[Database Seeder]: Created maintenance setting — ₹1,500");
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed maintenance setting:", error);
  }
};

const seedInvoices = async (): Promise<void> => {
  try {
    const existing = await InvoiceModel.count();
    if (existing > 0) {
      console.log("[Database Seeder]: Invoices already seeded. Skipping.");
      return;
    }

    console.log("[Database Seeder]: Seeding invoices...");

    const apartments = await ApartmentModel.findAll();

    if (apartments.length === 0) {
      console.log("[Database Seeder]: No apartments found. Skipping invoice seeding.");
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // June 2026
    for (let i = 0; i < apartments.length; i++) {
      const apartment = apartments[i];

      // The invoice belongs to whoever currently occupies the apartment.
      const occupant = await ResidentModel.findOne({
        where: { apartmentId: apartment.id, isActive: true, isOccupant: true },
      });
      const occupantResidentId = occupant?.id ?? null;

      // No occupant means nobody to bill — resident_id cannot be null.
      if (occupantResidentId == null) {
        console.log(`[Database Seeder]: Apartment ${apartment.id} has no occupant. Skipping invoices.`);
        continue;
      }

      const juneStatus =
        i < 3 ? InvoiceStatus.PAID
        : i < 5 ? InvoiceStatus.OVERDUE
        : InvoiceStatus.PENDING;

      const juneExtraCharges = i === 0
        ? [{ label: "Parking Maintenance", amount: 200 }]
        : i === 2
          ? [{ label: "Common Area Electricity", amount: 350 }]
          : [];

      const juneTotal = 1500 + juneExtraCharges.reduce((s, c) => s + c.amount, 0);
      const junePaidAt = juneStatus === InvoiceStatus.PAID ? new Date(2026, 5, 15) : null;
      const junePaymentRef = juneStatus === InvoiceStatus.PAID ? `pi_test_june_${apartment.id}` : null;

      await InvoiceModel.create({
        apartmentId: apartment.id,
        residentId: occupantResidentId,
        month: 6,
        year: 2026,
        baseAmount: 1500,
        extraCharges: juneExtraCharges,
        totalAmount: juneTotal,
        status: juneStatus,
        dueDate: new Date(2026, 5, 15),
        paidAt: junePaidAt,
        paymentRef: junePaymentRef,
        pdfUrl: null,
        createdAt: new Date(2026, 5, 1),
      });

      // July 2026 invoice — all pending
      const julyExtraCharges = i === 4
        ? [{ label: "Water Charges", amount: 500 }]
        : i === 6
          ? [{ label: "Clubhouse Maintenance", amount: 300 }]
          : [];

      const julyTotal = 1500 + julyExtraCharges.reduce((s, c) => s + c.amount, 0);

      await InvoiceModel.create({
        apartmentId: apartment.id,
        residentId: occupantResidentId,
        month: 7,
        year: 2026,
        baseAmount: 1500,
        extraCharges: julyExtraCharges,
        totalAmount: julyTotal,
        status: InvoiceStatus.PENDING,
        dueDate: new Date(2026, 6, 15),
        paidAt: null,
        paymentRef: null,
        pdfUrl: null,
        createdAt: new Date(2026, 6, 1),
      });
    }

    console.log(`[Database Seeder]: ${apartments.length * 2} invoices created (June + July 2026).`);
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed invoices:", error);
  }
};

// One-time backfill: older invoices were created with residentId = null. Assign
// each to the apartment's current occupant, falling back to the owner.
const backfillInvoiceResidents = async (): Promise<void> => {
  try {
    const orphanInvoices = await InvoiceModel.findAll({ where: { residentId: null as any } });
    if (orphanInvoices.length === 0) return;

    console.log(`[Database Seeder]: Backfilling residentId for ${orphanInvoices.length} invoice(s)...`);

    let updated = 0;
    for (const invoice of orphanInvoices) {
      const occupant = await ResidentModel.findOne({
        where: { apartmentId: invoice.apartmentId, isActive: true, isOccupant: true },
      });
      const owner = occupant
        ? null
        : await ResidentModel.findOne({
            where: { apartmentId: invoice.apartmentId, isOwner: true },
          });

      const residentId = occupant?.id ?? owner?.id ?? null;
      if (residentId != null) {
        await InvoiceModel.update({ residentId }, { where: { id: invoice.id } });
        updated++;
      }
    }

    console.log(`[Database Seeder]: Backfilled residentId for ${updated} invoice(s).`);
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to backfill invoice residents:", error);
  }
};

const seedOrUpdateAmenities = async (): Promise<void> => {
  try {
    const defaultAmenities = [
      {
        name: "Swimming Pool",
        description: "Olympic-sized temperature-controlled pool with a dedicated kids splash area, lane dividers, and certified lifeguard on duty.",
        capacity: 30,
        operatingStart: "06:00",
        operatingEnd: "21:00",
        price: 0,
        bookingType: AmenityBookingType.SHARED_CAPACITY,
        images: [
          "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1572331165267-854da2b10ccc?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80",
        ],
        isActive: true,
      },
      {
        name: "Fitness Gymnasium",
        description: "Fully equipped modern gym with cardio treadmills, ellipticals, free weights, resistance machines, and a certified fitness trainer.",
        capacity: 25,
        operatingStart: "05:30",
        operatingEnd: "22:00",
        price: 0,
        bookingType: AmenityBookingType.SHARED_CAPACITY,
        images: [
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
        ],
        isActive: true,
      },
      {
        name: "Yoga & Meditation Studio",
        description: "Peaceful bamboo-floored studio with acoustic soundproofing, yoga mats, meditation blocks, and serene natural ambient light.",
        capacity: 20,
        operatingStart: "06:00",
        operatingEnd: "20:00",
        price: 0,
        bookingType: AmenityBookingType.SHARED_CAPACITY,
        images: [
          "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80",
        ],
        isActive: true,
      },
      {
        name: "Clubhouse Banquet Hall",
        description: "Air-conditioned banquet hall with integrated sound system, HD projector, mood lighting, and catering pantry. Ideal for family celebrations and community gatherings.",
        capacity: 120,
        operatingStart: "09:00",
        operatingEnd: "23:00",
        price: 2000,
        bookingType: AmenityBookingType.EXCLUSIVE,
        images: [
          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80",
        ],
        isActive: true,
      },
      {
        name: "Tennis Court",
        description: "Synthetic turf floodlit tennis court with equipment rental, baseline netting, and evening play capability.",
        capacity: 4,
        operatingStart: "06:00",
        operatingEnd: "20:00",
        price: 300,
        bookingType: AmenityBookingType.EXCLUSIVE,
        images: [
          "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80",
        ],
        isActive: true,
      },
      {
        name: "Badminton Court",
        description: "Indoor wooden badminton court with non-marking flooring, high anti-glare ceilings, and LED tournament arena lighting.",
        capacity: 4,
        operatingStart: "06:00",
        operatingEnd: "22:00",
        price: 150,
        bookingType: AmenityBookingType.EXCLUSIVE,
        images: [
          "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1613918431703-aa632b7754b2?w=800&auto=format&fit=crop&q=80",
        ],
        isActive: true,
      },
      {
        name: "Community Rooftop BBQ Lounge",
        description: "Panoramic skyline rooftop terrace with premium BBQ grills, ambient pergolas, fairy lights, and comfortable outdoor seating.",
        capacity: 40,
        operatingStart: "16:00",
        operatingEnd: "22:30",
        price: 500,
        bookingType: AmenityBookingType.EXCLUSIVE,
        images: [
          "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80",
        ],
        isActive: true,
      },
      {
        name: "Squash Court",
        description: "Glass-backed regulation squash court with maple hardwood floor, spectator viewing area, and high-flow air conditioning.",
        capacity: 2,
        operatingStart: "06:00",
        operatingEnd: "21:00",
        price: 200,
        bookingType: AmenityBookingType.EXCLUSIVE,
        images: [
          "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
        ],
        isActive: true,
      },
    ];

    for (const item of defaultAmenities) {
      const existing = await AmenityModel.findOne({ where: { name: item.name } });
      if (!existing) {
        await AmenityModel.create(item);
        console.log(`[Database Seeder]: Created amenity "${item.name}" (${item.bookingType})`);
      } else {
        const updateData: Record<string, unknown> = {};
        if (!existing.bookingType || existing.bookingType !== item.bookingType) {
          updateData.bookingType = item.bookingType;
          if (item.bookingType === AmenityBookingType.SHARED_CAPACITY) updateData.price = 0;
        }
        const existingImgs = Array.isArray(existing.images) ? existing.images : [];
        if (existingImgs.length === 0) {
          updateData.images = item.images;
        }
        if (Object.keys(updateData).length > 0) {
          await AmenityModel.update(updateData, { where: { id: existing.id } });
          console.log(`[Database Seeder]: Updated amenity "${item.name}" with ${JSON.stringify(updateData)}`);
        }
      }
    }
    console.log("[Database Seeder]: Amenities checked & seeded successfully!");
  } catch (error) {
    console.error("[Database Seeder] CRITICAL: Failed to seed/update amenities:", error);
  }
};

export const runDatabaseSeeders = async (): Promise<void> => {
  console.log("-----------------------------------------");
  console.log("[Database Seeder]: Initializing data seeding sequence...");

  await seedDefaultUsers();
  // await seedApartments();
  // await seedResidents();
  await seedCommitteeMembers();
  await seedFamilyMembers();
  await seedVehicles();
  await seedNotices();
  await seedComplaints();
  await seedComplaintComments();
  await seedComplaintImages();
  await seedMaintenanceSetting();
  await seedInvoices();
  await backfillInvoiceResidents();
  await seedOrUpdateAmenities();

  console.log("[Database Seeder]: Seeding sequence complete.");
  console.log("-----------------------------------------");
};
