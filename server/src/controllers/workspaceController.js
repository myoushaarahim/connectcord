import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import { notifyWorkspaceMembers } from "../sse/eventHub.js";

export const listWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.userId })
      .sort({ updatedAt: -1 })
      .select("name description owner members inviteCode createdAt updatedAt");
    // Older workspaces were created before invite codes existed. Assign one lazily.
    await Promise.all(workspaces.map(async (workspace) => {
      if (!workspace.inviteCode) {
        workspace.inviteCode = randomBytes(4).toString("hex").toUpperCase();
        await workspace.save();
      }
    }));
    return res.json({ workspaces });
  } catch (error) {
    console.error("listWorkspaces:", error);
    return res.status(500).json({ message: "Could not load workspaces" });
  }
};

export const createWorkspace = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    if (!name) return res.status(400).json({ message: "Workspace name is required" });
    if (name.length > 60) return res.status(400).json({ message: "Workspace name must be 60 characters or fewer" });

    const workspace = await Workspace.create({
      name, description, owner: req.userId, members: [req.userId],
      inviteCode: randomBytes(4).toString("hex").toUpperCase(),
    });
    await Channel.create({ name: "general", workspace: workspace._id, createdBy: req.userId });
    return res.status(201).json({ workspace });
  } catch (error) {
    console.error("createWorkspace:", error);
    return res.status(500).json({ message: "Could not create workspace" });
  }
};

export const joinWorkspace = async (req, res) => {
  try {
    const inviteCode = typeof req.body.inviteCode === "string" ? req.body.inviteCode.trim().toUpperCase() : "";
    if (!inviteCode) return res.status(400).json({ message: "Enter a workspace invite code" });

    const workspace = await Workspace.findOne({ inviteCode });
    if (!workspace) return res.status(404).json({ message: "Workspace invite code not found" });

    const alreadyMember = workspace.members.some((memberId) => String(memberId) === String(req.userId));
    if (!alreadyMember) {
      workspace.members.push(req.userId);
      await workspace.save();
      void notifyWorkspaceMembers(workspace._id, req.userId, {
        type: "member_joined",
        title: "New workspace member",
        message: "A new member joined the workspace",
        workspaceId: String(workspace._id),
        createdAt: new Date().toISOString(),
      });
    }

    return res.json({ workspace, alreadyMember });
  } catch (error) {
    console.error("joinWorkspace:", error);
    return res.status(500).json({ message: "Could not join workspace" });
  }
};

export const getWorkspace = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.workspaceId)) return res.status(400).json({ message: "Invalid workspace ID" });
    const workspace = await Workspace.findOne({ _id: req.params.workspaceId, members: req.userId })
      .populate("owner", "username")
      .populate("members", "username email");
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const channels = await Channel.find({ workspace: workspace._id }).sort({ createdAt: 1 });
    return res.json({ workspace, channels });
  } catch (error) {
    console.error("getWorkspace:", error);
    return res.status(500).json({ message: "Could not load workspace" });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({ message: "Invalid workspace ID" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Only owner can delete the workspace
    if (String(workspace.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Only the workspace owner can delete this workspace" });
    }

    // Find all channels belonging to this workspace
    const channels = await Channel.find({ workspace: workspaceId }).select("_id");
    const channelIds = channels.map((c) => c._id);

    // Delete all messages in these channels
    if (channelIds.length > 0) {
      await Message.deleteMany({ channel: { $in: channelIds } });
    }

    // Delete all channels
    await Channel.deleteMany({ workspace: workspaceId });

    // Notify workspace members via SSE before removing workspace document
    void notifyWorkspaceMembers(workspaceId, req.userId, {
      type: "workspace_deleted",
      title: "Workspace deleted",
      message: `"${workspace.name}" was deleted by its owner`,
      workspaceId: String(workspaceId),
      createdAt: new Date().toISOString(),
    });

    // Delete the workspace document
    await Workspace.deleteOne({ _id: workspaceId });

    return res.json({ message: "Workspace deleted successfully", workspaceId });
  } catch (error) {
    console.error("deleteWorkspace:", error);
    return res.status(500).json({ message: "Could not delete workspace" });
  }
};

