export class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = HttpError.name;
		Error.captureStackTrace(this, this.constructor);
	}

	static BadRequest(message = "Bad Request") {
		return new HttpError(400, message);
	}

	static Unauthorized(message = "Unauthorized") {
		return new HttpError(401, message);
	}

	static Forbidden(message = "Forbidden") {
		return new HttpError(403, message);
	}

	static NotFound(message = "Not Found") {
		return new HttpError(404, message);
	}

	static Conflict(message = "Conflict") {
		return new HttpError(409, message);
	}

	static InternalServerError(message = "Internal Server Error") {
		return new HttpError(500, message);
	}
}
