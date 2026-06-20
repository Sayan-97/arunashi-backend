import { Router, type Request, type Response } from "express";
import { realtimeService } from "../services/realtime.service";

const router: Router = Router();

router.get("/stream", (req: Request, res: Response) => {
	// SSE Headers
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.setHeader("X-Accel-Buffering", "no"); // Prevent nginx or proxy buffering

	// Flush the headers to establish the connection
	res.flushHeaders();

	// Register SSE stream client response
	realtimeService.addClient(res);

	// Remove client when connection is closed
	req.on("close", () => {
		realtimeService.removeClient(res);
	});
});

export default router;
