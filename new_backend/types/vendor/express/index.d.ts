import { type UserBasicDetails } from "../../../schemas/userBasicDetails.ts";

declare global {
    namespace Express {
        interface Request {
            user?: UserBasicDetails
        }
    }
}