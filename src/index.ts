import type { Server } from "node:http";

import app from "@/app";
import { env } from "@/configs/env";
import { startServer } from "@/prisma";
import { registerGracefulShutdown } from "@/helpers/gracefulShutdown";

await startServer();

const server: Server = app.listen(env.PORT, () => {
	console.log(`Server running at http://localhost:${env.PORT}`);
});

registerGracefulShutdown(server);
