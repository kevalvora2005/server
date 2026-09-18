import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import app from "./app";
import { env } from "./shared/config/env";
import { connectDB, sequelize } from "./shared/config/db";
import "./shared/config/i18n";
import { initSocket } from "./shared/socket/socket.server";
import { initScheduledJobs } from "./shared/jobs/scheduler";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    initScheduledJobs();
    console.log("⏰ Daily cron jobs initialized");

    const httpServer = createServer(app);
    initSocket(httpServer);

    const server = httpServer.listen(env.PORT, () => {
      console.log(`
        🚀 Server running on port ${env.PORT}
        🌍 Environment: ${process.env.NODE_ENV}
        🔌 Socket.io initialized
      `);
    });

    const shutdown = async () => {
      console.log("\n🛑 Shutting down server...");
      server.close(async () => {
        try {
          await sequelize.close();
          console.log("✅ Sequelize PostgreSQL connections closed gracefully");
          process.exit(0);
        } catch (error) {
          console.error("❌ Shutdown error", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

startServer();