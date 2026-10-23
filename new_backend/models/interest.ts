import mongoose, { Schema, type InferSchemaType } from "mongoose";

const interestSchema = new Schema({
    _id: { type: String, required: true }, // whatever the interest is
});

export const InterestModel = mongoose.model<Interest>("InterestModel", interestSchema);
export type Interest = InferSchemaType<typeof interestSchema>;