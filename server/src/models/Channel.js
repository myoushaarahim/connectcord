import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 250, default: "" },
    type: { type: String, enum: ["text", "voice", "dm"], default: "text" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: false, default: null },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

channelSchema.index(
  { workspace: 1, name: 1 },
  { unique: true, partialFilterExpression: { workspace: { $type: "objectId" } } }
);
channelSchema.index({ recipients: 1 });
export default mongoose.model("Channel", channelSchema);
