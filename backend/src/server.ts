import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log(' Successfully connected to PostgreSQL via Prisma');

    app.listen(PORT, () => {
      console.log(`🚀 PlaceMux Backend Server running on http://localhost:${PORT}`);
      console.log(` Swagger Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
