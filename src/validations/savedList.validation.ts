import { z } from "zod";

export const createSavedListSchema = z.object({
	name: z.string().nonempty("List name is required"),
	items: z.array(z.any()).min(1, "List must contain at least one item"),
});

export type CreateSavedListInput = z.infer<typeof createSavedListSchema>;
