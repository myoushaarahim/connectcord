import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    inviteCode: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Workspace", workspaceSchema);
