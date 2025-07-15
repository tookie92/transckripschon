import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Store transcription sessions
  transcriptions: defineTable({
    title: v.string(),
    status: v.union(v.literal("uploading"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    audioFileId: v.optional(v.id("_storage")), // Convex file storage ID
    transcriptionText: v.optional(v.string()),
    duration: v.optional(v.number()), // in seconds
    language: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_creation_time", ["createdAt"])
  .index("by_status", ["status"]),
});