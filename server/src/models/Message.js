import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: "Channel", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ channel: 1, createdAt: -1 });
export default mongoose.model("Message", messageSchema);
