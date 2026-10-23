import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const storySchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'A story must have a title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: { type: String, unique: true, index: true },
    bannerImageUrl: { type: String, trim: true },
    bannerImageData: { type: String, select: false },
    bannerImageMimeType: { type: String },
    blurhash: { type: String, default: '' },
    bodyMarkdown: {
      type: String,
      required: [true, 'Story content cannot be empty'],
    },
    excerpt: {
      type: String,
      maxlength: [200, 'Excerpt cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'archived'],
      default: 'draft',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A story must belong to an author'],
    },
    eventTimeframe: {
      type: String,
      trim: true,
      maxlength: [60, 'Timeframe string is too long'],
    },
    viewCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

storySchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
storySchema.index({ author: 1, status: 1, isDeleted: 1, createdAt: -1 });
storySchema.index({ title: "text", bodyMarkdown: "text" });
storySchema.index({ deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { isDeleted: true } });

storySchema.pre('validate', function () {
  if (this.isModified('title') && !this.slug) {
    const Slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    this.slug = Slug;
  }

  if (this.isModified('bodyMarkdown') && !this.excerpt) {
    const plainText = this.bodyMarkdown.replace(/[#*`_[\]()]/g, '').trim();
    this.excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }
});

export const StoryModel = mongoose.model<Story>('Story', storySchema);
export type Story = InferSchemaType<typeof storySchema>;
