import type { Server } from "node:http";

import app from "@/app";
import { env } from "@/configs/env";
import { startServer } from "@/prisma";
import { registerGracefulShutdown } from "@/helpers/gracefulShutdown";

await startServer();

const server: Server = app.listen(env.PORT, (err?: any) => {
	if (err) {
		console.error(`Failed to start server: ${err.message || err}`);
		process.exit(1);
	}
	console.log(`Server running at http://localhost:${env.PORT}`);
});

registerGracefulShutdown(server);
