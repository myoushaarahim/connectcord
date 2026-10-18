import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: { type: String, trim: true, maxlength: 4000, default: "" },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: "Channel", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    editedAt: { type: Date, default: null },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, default: "" },
        contentType: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    ],
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ channel: 1, createdAt: -1 });
export default mongoose.model("Message", messageSchema);
