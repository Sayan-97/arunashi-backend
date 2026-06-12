import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "@/configs/env";

const connectionString = `${env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };

export const startServer = async () => {
	try {
		await prisma.$connect();
		console.log("Database connected successfully");
	} catch (error) {
		console.error("Failed to connect to database");
		console.error(error);
		process.exit(1);
	}
};
