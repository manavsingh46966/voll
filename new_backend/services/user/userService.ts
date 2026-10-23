import { UserModel } from "../../models/user.ts";
import { type CreateAccountDetails } from "../../schemas/createAccountDetails.ts";
import { type UserBasicDetails } from "../../schemas/userBasicDetails.ts";
import { type Result } from "../../types/common/result.ts";

export async function createAccountService(userBasicDetails: UserBasicDetails, createAccountDetails: CreateAccountDetails): Promise<Result<{ userId: string; isRegistered: boolean }>> {
    const stubUser = await UserModel.findOne({ email: userBasicDetails.email });
    if (!stubUser) {
        return { success: false, errorType: "NOT_FOUND", message: "User not found." };
    }

    const { mobileNumber, phoneNumber, ...rest } = createAccountDetails;
    stubUser.set({
        ...rest,
        phoneNumber: mobileNumber || phoneNumber || stubUser.phoneNumber || "",
    });
    await stubUser.save();

    return { success: true, data: { userId: String(stubUser._id), isRegistered: true } };
}
