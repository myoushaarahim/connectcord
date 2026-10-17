import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";
import User from "../models/User.js";

export const attachSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Authenticate every socket connection with the same JWT used by REST APIs.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!mongoose.isValidObjectId(payload.userId)) {
        return next(new Error("Invalid authentication token"));
      }

      socket.userId = payload.userId;
      User.findById(payload.userId).select("username").lean()
        .then((user) => {
          socket.data.username = user?.username || "Someone";
          next();
        })
        .catch(() => next(new Error("Could not load user profile")));
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  // Track active sockets per user so multiple tabs don't mark someone offline prematurely.
  const activeSocketsByUser = new Map();

  io.on("connection", (socket) => {
    const userId = String(socket.userId);
    const userSockets = activeSocketsByUser.get(userId) || new Set();
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);
    activeSocketsByUser.set(userId, userSockets);

    if (wasOffline) {
      socket.broadcast.emit("presence:changed", { userId, status: "online" });
    }

    socket.on("typing:start", async (channelId) => {
      try {
        if (!mongoose.isValidObjectId(channelId)) return;
        const channel = await Channel.findById(channelId).select("workspace");
        if (!channel) return;
        const isMember = await Workspace.exists({ _id: channel.workspace, members: socket.userId });
        if (!isMember || !socket.rooms.has(`channel:${channelId}`)) return;
        socket.to(`channel:${channelId}`).emit("typing:changed", {
          userId,
          username: socket.data.username || "Someone",
          isTyping: true,
        });
      } catch {
        // Typing indicators are best-effort and should not interrupt chat.
      }
    });

    
    // WebRTC signaling: join the voice room for an authorized channel.
    socket.on("voice:join", async (channelId, callback) => {
      try {
        if (!mongoose.isValidObjectId(channelId)) {
          return callback?.({ ok: false, message: "Invalid channel" });
        }

        const channel = await Channel.findById(channelId).select("workspace");
        if (!channel) {
          return callback?.({ ok: false, message: "Channel not found" });
        }

        const isMember = await Workspace.exists({
          _id: channel.workspace,
          members: socket.userId,
        });

        if (!isMember) {
          return callback?.({
            ok: false,
            message: "You do not have access to this voice channel",
          });
        }

        const room = `voice:${channelId}`;

        // Avoid joining the same voice room twice.
        if (socket.rooms.has(room)) {
          return callback?.({ ok: true, peers: [] });
        }

        // Find participants who are already in the voice room.
        const existingSockets = await io.in(room).fetchSockets();

        socket.join(room);

        // Tell existing participants that a new peer has joined.
        socket.to(room).emit("voice:peer-joined", {
          peerId: socket.id,
          username: socket.data.username || "Someone",
        });

        callback?.({
          ok: true,
          peers: existingSockets.map((peer) => ({
            peerId: peer.id,
            username: peer.data.username || "Someone",
          })),
        });
      } catch {
        callback?.({
          ok: false,
          message: "Could not join the voice channel",
        });
      }
    });

    // Relay WebRTC signaling only between participants in the same voice room.
    const relayVoiceSignal = (eventName, payload) => {
      try {
        const { to, channelId, description, candidate } = payload || {};

        if (
          typeof to !== "string" ||
          !mongoose.isValidObjectId(channelId)
        ) {
          return;
        }

        const room = `voice:${channelId}`;
        const targetSocket = io.sockets.sockets.get(to);

        // Both sender and recipient must be in the same authorized voice room.
        if (
          !socket.rooms.has(room) ||
          !targetSocket ||
          !targetSocket.rooms.has(room)
        ) {
          return;
        }

        socket.to(to).emit(eventName, {
          from: socket.id,
          channelId,
          ...(description ? { description } : {}),
          ...(candidate ? { candidate } : {}),
        });
      } catch {
        // Signaling errors should not interrupt other real-time features.
      }
    };

    socket.on("voice:offer", (payload) => {
      relayVoiceSignal("voice:offer", payload);
    });

    socket.on("voice:answer", (payload) => {
      relayVoiceSignal("voice:answer", payload);
    });

    socket.on("voice:ice-candidate", (payload) => {
      relayVoiceSignal("voice:ice-candidate", payload);
    });

    // Leave a voice room and notify the other participants.
    socket.on("voice:leave", (channelId) => {
      if (!mongoose.isValidObjectId(channelId)) return;

      const room = `voice:${channelId}`;
      if (!socket.rooms.has(room)) return;

      socket.to(room).emit("voice:peer-left", {
        peerId: socket.id,
      });

      socket.leave(room);
    });

    // Notify voice participants if a browser disconnects unexpectedly.
    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room.startsWith("voice:")) {
          socket.to(room).emit("voice:peer-left", {
            peerId: socket.id,
          });
        }
      }
    });


    socket.on("typing:stop", (channelId) => {
      if (typeof channelId === "string" && socket.rooms.has(`channel:${channelId}`)) {
        socket.to(`channel:${channelId}`).emit("typing:changed", {
          userId,
          isTyping: false,
        });
      }
    });

    socket.on("channel:join", async (channelId, callback) => {
      try {
        if (!mongoose.isValidObjectId(channelId)) {
          return callback?.({ ok: false, message: "Invalid channel" });
        }

        const channel = await Channel.findById(channelId).select("workspace");
        if (!channel) return callback?.({ ok: false, message: "Channel not found" });

        const isMember = await Workspace.exists({
          _id: channel.workspace,
          members: socket.userId,
        });
        if (!isMember) {
          return callback?.({ ok: false, message: "You do not have access to this channel" });
        }

        // Leave previous channel rooms so events only arrive for the active channel.
        for (const room of socket.rooms) {
          if (room.startsWith("channel:")) socket.leave(room);
        }

        socket.join(`channel:${channelId}`);
        callback?.({ ok: true });
      } catch {
        callback?.({ ok: false, message: "Could not join channel" });
      }
    });

    socket.on("channel:leave", (channelId) => {
      if (typeof channelId === "string") {
        socket.to(`channel:${channelId}`).emit("typing:changed", { userId, isTyping: false });
        socket.leave(`channel:${channelId}`);
      }
    });

    socket.on("disconnect", () => {
      const sockets = activeSocketsByUser.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        activeSocketsByUser.delete(userId);
        socket.broadcast.emit("presence:changed", { userId, status: "offline" });
      }
    });
  });

  return io;
};
