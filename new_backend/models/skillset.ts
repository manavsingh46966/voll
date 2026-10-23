import mongoose, { Schema, type InferSchemaType } from "mongoose";

const skillsetSchema = new Schema({
    _id: { type: String, required: true }, // whatever the skillset is
});

export const SkillsetModel = mongoose.model<Skillset>("SkillsetModel", skillsetSchema);
export type Skillset = InferSchemaType<typeof skillsetSchema>;