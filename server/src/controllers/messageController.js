import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { notifyWorkspaceMembers, sendUserEvent } from "../sse/eventHub.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");

const checkChannelAccess = async (channel, userId) => {
  if (channel.type === "dm") {
    return channel.recipients?.some((id) => String(id) === String(userId));
  }
  return await Workspace.exists({ _id: channel.workspace, members: userId });
};

export const listMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) return res.status(400).json({ message: "Invalid channel ID" });
    const channel = await Channel.findById(channelId).select("workspace name type recipients");
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    const isMember = await checkChannelAccess(channel, req.userId);
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
    const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];

    if (!content && attachments.length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    if (content.length > 4000) {
      return res.status(400).json({ message: "Message must be 4,000 characters or fewer" });
    }

    const channel = await Channel.findById(channelId).select("workspace name type recipients");
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    const isMember = await checkChannelAccess(channel, req.userId);
    if (!isMember) return res.status(403).json({ message: "You do not have access to this channel" });

    const message = await Message.create({
      content,
      attachments,
      channel: channelId,
      author: req.userId,
    });
    const populated = await message.populate("author", "username");

    // Notify clients in this channel only after MongoDB has saved the message.
    const io = req.app.get("io");
    io?.to(`channel:${channelId}`).emit("message:new", {
      _id: populated._id,
      content: populated.content,
      attachments: populated.attachments || [],
      channel: populated.channel,
      author: {
        _id: populated.author._id,
        username: populated.author.username,
      },
      reactions: populated.reactions || [],
      createdAt: populated.createdAt,
    });

    if (channel.type === "dm") {
      const otherRecipient = channel.recipients?.find((id) => String(id) !== String(req.userId));
      if (otherRecipient) {
        sendUserEvent(otherRecipient, "notification", {
          type: "dm_message",
          title: `Direct message from @${populated.author.username}`,
          message: content || (attachments.length ? "Sent an attachment" : "New message"),
          channelId: String(channelId),
          createdAt: new Date().toISOString(),
        });
      }
    } else if (channel.workspace) {
      void notifyWorkspaceMembers(channel.workspace, req.userId, {
        type: "new_message",
        title: `New message in #${channel.name}`,
        message: `${populated.author.username}: ${(content || "Sent an attachment").slice(0, 100)}`,
        workspaceId: String(channel.workspace),
        channelId: String(channelId),
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(201).json({ message: populated });
  } catch (error) {
    console.error("createMessage:", error);
    return res.status(500).json({ message: "Could not send message" });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    if (!emoji || typeof emoji !== "string") {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const channel = await Channel.findById(message.channel).select("workspace type recipients");
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const isMember = await checkChannelAccess(channel, req.userId);
    if (!isMember) return res.status(403).json({ message: "You do not have access to this channel" });

    if (!message.reactions) {
      message.reactions = [];
    }

    const reactionGroup = message.reactions.find((r) => r.emoji === emoji);

    if (reactionGroup) {
      const userIndex = reactionGroup.users.findIndex(
        (id) => String(id) === String(req.userId)
      );
      if (userIndex > -1) {
        // User already reacted -> remove reaction
        reactionGroup.users.splice(userIndex, 1);
        if (reactionGroup.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        // Add reaction
        reactionGroup.users.push(req.userId);
      }
    } else {
      // First reaction with this emoji
      message.reactions.push({
        emoji,
        users: [req.userId],
      });
    }

    await message.save();

    // Broadcast updated reactions to everyone in the channel over Socket.IO
    const io = req.app.get("io");
    io?.to(`channel:${message.channel}`).emit("message:reaction", {
      messageId: String(message._id),
      channelId: String(message.channel),
      reactions: message.reactions,
    });

    return res.json({ messageId: message._id, reactions: message.reactions });
  } catch (error) {
    console.error("toggleReaction:", error);
    return res.status(500).json({ message: "Could not update reaction" });
  }
};

export const getOrCreateDMChannel = async (req, res) => {
  try {
    const { recipientId } = req.params;
    if (!mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient ID" });
    }
    if (String(recipientId) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot start a direct message with yourself" });
    }

    const recipient = await User.findById(recipientId).select("username email");
    if (!recipient) return res.status(404).json({ message: "Recipient user not found" });

    // Look for existing DM channel with both recipients
    let channel = await Channel.findOne({
      type: "dm",
      recipients: { $all: [req.userId, recipientId], $size: 2 },
    }).populate("recipients", "username email");

    if (!channel) {
      channel = await Channel.create({
        name: `dm-${recipient.username.toLowerCase()}`,
        type: "dm",
        workspace: null,
        recipients: [req.userId, recipientId],
        createdBy: req.userId,
      });
      channel = await channel.populate("recipients", "username email");
    }

    return res.json({ channel });
  } catch (error) {
    console.error("getOrCreateDMChannel error:", error);
    return res.status(500).json({ message: "Could not open direct message" });
  }
};

export const listDMs = async (req, res) => {
  try {
    const channels = await Channel.find({
      type: "dm",
      recipients: req.userId,
    })
      .populate("recipients", "username email")
      .sort({ updatedAt: -1 })
      .lean();

    const dmsWithMeta = await Promise.all(
      channels.map(async (c) => {
        const otherUser = c.recipients.find((u) => String(u._id) !== String(req.userId));
        const lastMsg = await Message.findOne({ channel: c._id })
          .sort({ createdAt: -1 })
          .populate("author", "username")
          .lean();

        return {
          id: c._id,
          name: otherUser?.username || "Direct Message",
          recipient: otherUser,
          preview: lastMsg?.content || (lastMsg?.attachments?.length ? "Sent an attachment" : "No messages yet"),
          time: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          updatedAt: lastMsg?.createdAt || c.updatedAt,
        };
      })
    );

    return res.json({ dms: dmsWithMeta });
  } catch (error) {
    console.error("listDMs error:", error);
    return res.status(500).json({ message: "Could not fetch direct messages" });
  }
};

export const uploadAttachment = async (req, res) => {
  try {
    const { filename, contentType, data } = req.body;
    if (!data || !filename) {
      return res.status(400).json({ message: "File data and filename are required" });
    }

    const base64Data = data.includes(";base64,") ? data.split(";base64,").pop() : data;
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 20 * 1024 * 1024) {
      return res.status(400).json({ message: "Attachment exceeds 20MB limit" });
    }

    const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFilename);

    await fs.writeFile(filePath, buffer);
    const origin = process.env.SERVER_URL || "http://localhost:5000";
    const url = `${origin}/uploads/${safeFilename}`;

    return res.json({
      url,
      filename,
      contentType: contentType || "application/octet-stream",
      size: buffer.length,
    });
  } catch (error) {
    console.error("uploadAttachment error:", error);
    return res.status(500).json({ message: "Failed to upload file attachment" });
  }
};
