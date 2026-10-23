import type { Request, Response } from "express";
import { CreateCommentSchema, UpdateCommentSchema } from "../schemas/comment.ts";
import { ObjectIdSchema, PaginationQuerySchema } from "../schemas/common.ts";
import {
  createComment,
  deleteComment,
  getComments,
  getReplies,
  likeComment,
  updateComment,
} from "../services/comment/commentService.ts";
import { sendError, sendResult } from "../utils/http.ts";
import { catchAsync } from "../utils/catchAsync.ts";

export const getCommentsHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid story id.");
    return;
  }

  const queryValidation = PaginationQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    sendError(
      res,
      400,
      "BAD_REQUEST",
      "Invalid comments query parameters.",
      queryValidation.error.flatten(),
    );
    return;
  }

  const { cursor, limit = 10 } = queryValidation.data;
  const result = await getComments(idValidation.data, req.user?.id, cursor, limit);
  sendResult(res, result);
});

export const getRepliesHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid comment id.");
    return;
  }

  const queryValidation = PaginationQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    sendError(
      res,
      400,
      "BAD_REQUEST",
      "Invalid replies query parameters.",
      queryValidation.error.flatten(),
    );
    return;
  }

  const { cursor, limit = 10 } = queryValidation.data;
  const result = await getReplies(idValidation.data, req.user?.id, cursor, limit);
  sendResult(res, result);
});

export const createCommentHandler = catchAsync(async (req: Request, res: Response) => {
  const storyIdValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!storyIdValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid story id.");
    return;
  }

  const validation = CreateCommentSchema.safeParse(req.body);
  if (!validation.success) {
    sendError(
      res,
      400,
      "BAD_REQUEST",
      "Invalid comment payload.",
      validation.error.flatten(),
    );
    return;
  }

  if (validation.data.parentId) {
    const parentValidation = ObjectIdSchema.safeParse(validation.data.parentId);
    if (!parentValidation.success) {
      sendError(res, 400, "BAD_REQUEST", "Invalid parent comment id.");
      return;
    }
  }

  const result = await createComment(
    storyIdValidation.data,
    req.user!.id,
    validation.data,
  );
  sendResult(res, result, 201);
});

export const likeCommentHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid comment id.");
    return;
  }

  const result = await likeComment(idValidation.data, req.user!.id);
  sendResult(res, result);
});

export const updateCommentHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid comment id.");
    return;
  }

  const validation = UpdateCommentSchema.safeParse(req.body);
  if (!validation.success) {
    sendError(
      res,
      400,
      "BAD_REQUEST",
      "Invalid comment payload.",
      validation.error.flatten(),
    );
    return;
  }

  const result = await updateComment(idValidation.data, req.user!.id, validation.data);
  sendResult(res, result);
});

export const deleteCommentHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid comment id.");
    return;
  }

  const result = await deleteComment(idValidation.data, req.user!.id);
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});