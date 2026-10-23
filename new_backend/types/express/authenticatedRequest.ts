import { type Request } from "express";
import { type UserBasicDetails } from "../../schemas/userBasicDetails.ts";

export interface AuthenticatedRequest extends Request {
    user: UserBasicDetails;
}