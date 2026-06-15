import { z } from "zod";

export const submitProductRequestSchema = z.object({
	items: z.array(z.any()).min(1, "Request must contain at least one product"),
});

export type SubmitProductRequestInput = z.infer<
	typeof submitProductRequestSchema
>;

export const updateRequestStatusSchema = z.object({
	status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export type UpdateRequestStatusInput = z.infer<
	typeof updateRequestStatusSchema
>;
