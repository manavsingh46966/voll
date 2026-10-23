import { type Request, type Response } from "express";
import {
  createStory,
  deleteStory,
  getStories,
  getStoryById,
  getStoryBySlug,
  likeStory,
  recordStoryRead,
  recordStoryView,
  updateStory,
} from "../services/story/storyService.ts";
import { CreateStorySchema, UpdateStorySchema } from "../schemas/story.ts";
import { ObjectIdSchema, StoriesQuerySchema } from "../schemas/common.ts";
import { sendError, sendResult } from "../utils/http.ts";
import { catchAsync } from "../utils/catchAsync.ts";

export const getStoriesHandler = catchAsync(async (req: Request, res: Response) => {
  const validation = StoriesQuerySchema.safeParse(req.query);
  if (!validation.success) {
    sendError(
      res,
      400,
      "BAD_REQUEST",
      "Invalid story query parameters.",
      validation.error.flatten(),
    );
    return;
  }

  const { limit = 10, cursor, authorId } = validation.data;
  const userId = req.user?.id;

  if (authorId === "me" && !userId) {
    sendError(res, 401, "UNAUTHORIZED", "You must be logged in to view your stories.");
    return;
  }

  const resolvedAuthorId = authorId === "me" ? userId : authorId;
  const result = await getStories(limit, cursor, userId, resolvedAuthorId);

  sendResult(res, result);
});

export const getStoryByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid story id.");
    return;
  }

  const result = await getStoryById(idValidation.data, req.user?.id);

  sendResult(res, result);
});

export const createStoryHandler = catchAsync(async (req: Request, res: Response) => {
  const validation = CreateStorySchema.safeParse(req.body);
  if (!validation.success) {
    sendError(
      res,
      400,
      "BAD_REQUEST",
      "Invalid story payload.",
      validation.error.flatten(),
    );
    return;
  }

  const result = await createStory(req.user!.id, validation.data);
  sendResult(res, result, 201);
});

export const updateStoryHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid story id.");
    return;
  }

  const validation = UpdateStorySchema.safeParse(req.body);
  if (!validation.success) {
    sendError(
      res,
      400,
      "BAD_REQUEST",
      "Invalid story update payload.",
      validation.error.flatten(),
    );
    return;
  }

  if (req.user?.role !== "superadmin") {
    validation.data.status = "pending_approval";
  }

  const result = await updateStory(idValidation.data, req.user!, validation.data);
  sendResult(res, result);
});

export const deleteStoryHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid story id.");
    return;
  }

  const result = await deleteStory(idValidation.data, req.user!);
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});

export const likeStoryHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid story id.");
    return;
  }

  const result = await likeStory(idValidation.data, req.user!.id);
  sendResult(res, result);
});

export const getStoryBySlugHandler = catchAsync(async (req: Request, res: Response) => {
  const slug = String(req.params.slug ?? "").trim();
  if (!slug) {
    sendError(res, 400, "BAD_REQUEST", "Invalid slug.");
    return;
  }

  const result = await getStoryBySlug(slug, req.user?.id);
  sendResult(res, result);
});

export const recordStoryViewHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid story id.");
    return;
  }

  const result = await recordStoryView(idValidation.data, req.user?.id);
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});

export const recordStoryReadHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid story id.");
    return;
  }

  const result = await recordStoryRead(idValidation.data, req.user?.id);
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});
