import { sequelize } from './sequelize';
export { sequelize }; 


import "../../modules/auth/infrastructure/models/UserModel";
import "../../modules/residents/infrastructure/models/ResidentModel";
import "../../modules/apartments/infrastructure/models/ApartmentModel";
import "../../modules/family-members/infrastructure/models/FamilyMemberModel";
import "../../modules/vehicles/infrastructure/models/VehicleModel";
import "../../modules/notices/infrastructure/models/NoticeModel";
import "../../modules/complaints/infrastructure/models/ComplaintModel";
import "../../modules/complaints/infrastructure/models/ComplaintCommentModel";
import "../../modules/complaints/infrastructure/models/ComplaintImageModel";
import "../../modules/notifications/infrastructure/models/NotificationModel";
import "../../modules/maintenance/infrastructure/models/MaintenanceSettingModel";
import "../../modules/maintenance/infrastructure/models/InvoiceModel";
import "../../modules/document-requests/infrastructure/models/DocumentRequestModel";
import "../../modules/document-requests/infrastructure/models/DocumentRequestVoteModel";
import "../../modules/amenities/infrastructure/models/AmenityModel";
import "../../modules/amenities/infrastructure/models/BookingModel";
import "../../modules/amenities/infrastructure/models/BlackoutModel";
import "../../modules/amenities/infrastructure/models/BookingVoteModel";

import { runDatabaseSeeders } from '../../../database/seeder/seeder';

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully via Sequelize');
    
    await sequelize.sync({ alter: true }); 
    console.log('🔄 All database tables synchronized successfully.');

    await runDatabaseSeeders();

  } catch (error) {
    console.error('❌ PostgreSQL connection failed via Sequelize', error);
    process.exit(1);
  }
};