import type { Server } from "node:http";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import app from "@/app";
import { env } from "@/configs/env";
import { startServer } from "@/prisma";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	cors({
		origin(origin, callback) {
			if (
				env.NODE_ENV === "development" ||
				!origin ||
				env.WHITELISTED_DOMAINS.includes(origin)
			) {
				callback(null, true);
			} else {
				callback(new Error(`CORS Error: ${origin} is not allowed.`), false);
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);
app.use(compression());
app.use(morgan("combined"));
app.use(
	helmet({
		crossOriginResourcePolicy: {
			policy: "cross-origin",
		},
	}),
);

const port: number = env.PORT;

startServer();

const server: Server = app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});

const shutdown = (signal: NodeJS.Signals | string): void => {
	console.log(`\n${signal} received. Shutting down...`);
	server.close(() => {
		console.log("Server closed.");
		process.exit(0);
	});
	setTimeout(() => {
		console.error("Forced shutdown.");
		process.exit(1);
	}, 5000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
	console.error("Uncaught exception:", err);
	shutdown("UncaughtException");
});
process.on("unhandledRejection", (reason) => {
	console.error("Unhandled rejection:", reason);
	shutdown("UnhandledRejection");
});
