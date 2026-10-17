import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 250, default: "" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

channelSchema.index({ workspace: 1, name: 1 }, { unique: true });
export default mongoose.model("Channel", channelSchema);
