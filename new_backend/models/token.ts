import mongoose, { Schema, type InferSchemaType } from "mongoose";

const refreshTokenSchema = new Schema({
    refreshToken: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: "180d"
    },
});

export const RefreshTokenModel = mongoose.model<RefreshToken>("RefreshToken", refreshTokenSchema);
export type RefreshToken = InferSchemaType<typeof refreshTokenSchema>;