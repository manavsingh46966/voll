import type { Response } from "express";
import { type AuthenticatedRequest } from "../types/express/authenticatedRequest.ts";
import { CreateAccountDetailsSchema } from "../schemas/createAccountDetails.ts";
import { createAccountService } from "../services/user/userService.ts";

export async function createAccountController(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parsed = CreateAccountDetailsSchema.safeParse(req.body);
    if (!parsed.success) {
        console.log("CreateAccountDetails parsing failed:", parsed.error);
        res.status(401).json({ message: "Invalid or missing credentials." });
        return;
    }

    const createAccountResult = await createAccountService(req.user, parsed.data);
    if (createAccountResult.success) {
        res.status(200).json(createAccountResult.data);
    } else {
        res.status(401).json({ message: createAccountResult.message });
    }
}
