import type { Server } from "node:http";
import app from "@/app";

const port: number = 8000;

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
