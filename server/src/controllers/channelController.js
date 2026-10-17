import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";
import { notifyWorkspaceMembers } from "../sse/eventHub.js";

export const listChannels = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!mongoose.isValidObjectId(workspaceId)) return res.status(400).json({ message: "Invalid workspace ID" });
    const isMember = await Workspace.exists({ _id: workspaceId, members: req.userId });
    if (!isMember) return res.status(404).json({ message: "Workspace not found" });
    const channels = await Channel.find({ workspace: workspaceId }).sort({ createdAt: 1 });
    return res.json({ channels });
  } catch (error) {
    console.error("listChannels:", error);
    return res.status(500).json({ message: "Could not load channels" });
  }
};

export const createChannel = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!mongoose.isValidObjectId(workspaceId)) return res.status(400).json({ message: "Invalid workspace ID" });
    const workspace = await Workspace.findOne({ _id: workspaceId, members: req.userId });
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const name = typeof req.body.name === "string" ? req.body.name.trim().toLowerCase().replace(/\s+/g, "-") : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(name)) {
      return res.status(400).json({ message: "Channel names must use 1–50 letters, numbers, or hyphens" });
    }
    const existing = await Channel.findOne({ workspace: workspaceId, name });
    if (existing) return res.status(409).json({ message: "That channel already exists" });
    const channel = await Channel.create({ name, description, workspace: workspaceId, createdBy: req.userId });
    void notifyWorkspaceMembers(workspaceId, req.userId, { type: "channel_created", title: "New channel", message: `#${channel.name} was created`, workspaceId: String(workspaceId), channelId: String(channel._id), createdAt: new Date().toISOString() });
    return res.status(201).json({ channel });
  } catch (error) {
    console.error("createChannel:", error);
    return res.status(500).json({ message: "Could not create channel" });
  }
};
