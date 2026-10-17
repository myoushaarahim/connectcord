import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import { notifyWorkspaceMembers } from "../sse/eventHub.js";

export const listMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) return res.status(400).json({ message: "Invalid channel ID" });
    const channel = await Channel.findById(channelId).select("workspace name");
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    const isMember = await Workspace.exists({ _id: channel.workspace, members: req.userId });
    if (!isMember) return res.status(403).json({ message: "You do not have access to this channel" });

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const messages = await Message.find({ channel: channelId })
      .sort({ createdAt: -1 }).limit(limit)
      .populate("author", "username")
      .lean();
    return res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("listMessages:", error);
    return res.status(500).json({ message: "Could not load messages" });
  }
};

export const createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) return res.status(400).json({ message: "Invalid channel ID" });
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!content) return res.status(400).json({ message: "Message cannot be empty" });
    if (content.length > 4000) return res.status(400).json({ message: "Message must be 4,000 characters or fewer" });

    const channel = await Channel.findById(channelId).select("workspace name");
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    const isMember = await Workspace.exists({ _id: channel.workspace, members: req.userId });
    if (!isMember) return res.status(403).json({ message: "You do not have access to this channel" });

    const message = await Message.create({ content, channel: channelId, author: req.userId });
    const populated = await message.populate("author", "username");

    // Notify clients in this channel only after MongoDB has saved the message.
    const io = req.app.get("io");
    io?.to(`channel:${channelId}`).emit("message:new", {
      _id: populated._id,
      content: populated.content,
      channel: populated.channel,
      author: {
        _id: populated.author._id,
        username: populated.author.username,
      },
      createdAt: populated.createdAt,
    });

    void notifyWorkspaceMembers(channel.workspace, req.userId, {
      type: "new_message",
      title: `New message in #${channel.name}`,
      message: `${populated.author.username}: ${content.slice(0, 100)}`,
      workspaceId: String(channel.workspace),
      channelId: String(channelId),
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ message: populated });
  } catch (error) {
    console.error("createMessage:", error);
    return res.status(500).json({ message: "Could not send message" });
  }
};
