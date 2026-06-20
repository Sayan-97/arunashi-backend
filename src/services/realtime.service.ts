import type { Response } from "express";

class RealtimeService {
	private clients: Response[] = [];
	private keepAliveInterval: NodeJS.Timeout | null = null;

	constructor() {
		// Keep-alive ping every 30 seconds to prevent connection timeouts
		this.keepAliveInterval = setInterval(() => {
			this.sendPing();
		}, 30000);
	}

	public addClient(res: Response): void {
		this.clients.push(res);
		// Send initial connect success event
		try {
			res.write(
				`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`,
			);
			if (typeof (res as any).flush === "function") {
				(res as any).flush();
			}
		} catch (error) {
			console.error("Error writing initial connected event to client:", error);
		}
		console.log(`SSE client connected. Active clients: ${this.clients.length}`);
	}

	public removeClient(res: Response): void {
		this.clients = this.clients.filter((client) => client !== res);
		console.log(
			`SSE client disconnected. Active clients: ${this.clients.length}`,
		);
	}

	public broadcast(eventType: string, data?: any): void {
		const payload = {
			type: eventType,
			data: data || null,
			timestamp: new Date().toISOString(),
		};

		const formattedMsg = `data: ${JSON.stringify(payload)}\n\n`;

		for (const client of this.clients) {
			try {
				client.write(formattedMsg);
				if (typeof (client as any).flush === "function") {
					(client as any).flush();
				}
			} catch (error) {
				// Suppress logs for stale clients that will be cleaned up on close event
			}
		}
	}

	private sendPing(): void {
		for (const client of this.clients) {
			try {
				client.write('data: {"type":"ping"}\n\n');
				if (typeof (client as any).flush === "function") {
					(client as any).flush();
				}
			} catch (error) {
				// Suppress logs
			}
		}
	}

	public destroy(): void {
		if (this.keepAliveInterval) {
			clearInterval(this.keepAliveInterval);
		}
	}
}

export const realtimeService = new RealtimeService();
