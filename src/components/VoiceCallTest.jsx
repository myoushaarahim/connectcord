
import { useEffect, useRef, useState } from "react";

const Icon = ({ name, size = 18 }) => {
  const paths = {
    phone: (
      <>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.9L7.1 10.3a16 16 0 0 0 6.6 6.6l1.9-1.9a2 2 0 0 1 1.9-.6l2.8.5a2 2 0 0 1 1.7 2Z" />
      </>
    ),
    "audio-lines": (
      <>
        <path d="M2 10v4M6 6v12M10 3v18M14 7v10M18 5v14M22 10v4" />
      </>
    ),
    "user-round": (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </>
    ),
    headphones: (
      <>
        <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
        <path d="M5 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2ZM19 14h-2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2Z" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
      </>
    ),
    "mic-off": (
      <>
        <path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 9V5a3 3 0 0 0-5.8-1M5 10v2a7 7 0 0 0 11.9 5M19 10v2a7 7 0 0 1-.4 2.3M12 19v3M8 22h8M2 2l20 20" />
      </>
    ),
    "phone-off": (
      <>
        <path d="M10.5 13.5a16 16 0 0 0 3.7 3.4l1.9-1.9a2 2 0 0 1 1.9-.6l2.8.5a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8" />
        <path d="m2 2 20 20" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

export default function VoiceCallTest({ socket, channelId }) {
  const [status, setStatus] = useState("Not connected");
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState([]);

  const localAudioRef = useRef(null);
  const localStreamRef = useRef(null);

  // Each participant gets their own connection and ICE candidate queue.
  const peerConnectionsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const joinedRef = useRef(false);
  const startCallRef = useRef(null);
  const hangUpRef = useRef(null);

  useEffect(() => {
    if (!socket || !channelId) return;

    let disposed = false;

    const updateParticipant = (peerId, changes) => {
      setRemoteParticipants((previous) => {
        const existing = previous.find((p) => p.peerId === peerId);

        if (existing) {
          return previous.map((p) =>
            p.peerId === peerId ? { ...p, ...changes } : p
          );
        }

        return [
          ...previous,
          {
            peerId,
            username: "Participant",
            stream: null,
            connected: false,
            ...changes,
          },
        ];
      });
    };

    const removeParticipant = (peerId) => {
      setRemoteParticipants((previous) =>
        previous.filter((p) => p.peerId !== peerId)
      );
    };

    const createPeerConnection = (peerId, username = "Participant") => {
      const existing = peerConnectionsRef.current.get(peerId);

      if (existing) {
        updateParticipant(peerId, { username });
        return existing;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      peerConnectionsRef.current.set(peerId, pc);
      pendingCandidatesRef.current.set(peerId, []);

      const stream = localStreamRef.current;

      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      updateParticipant(peerId, { username });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("voice:ice-candidate", {
            to: peerId,
            channelId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const remoteStream =
          event.streams?.[0] ||
          new MediaStream([event.track]);

        updateParticipant(peerId, {
          username,
          stream: remoteStream,
        });
      };

      pc.onconnectionstatechange = () => {
        if (peerConnectionsRef.current.get(peerId) !== pc) return;

        if (pc.connectionState === "connected") {
          updateParticipant(peerId, {
            username,
            connected: true,
          });
          setStatus("Voice connected");
        } else if (pc.connectionState === "connecting") {
          updateParticipant(peerId, { connected: false });
          setStatus("Connecting audio...");
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          updateParticipant(peerId, { connected: false });
        } else if (pc.connectionState === "disconnected") {
          updateParticipant(peerId, { connected: false });
          setStatus("Audio connection interrupted");
        }
      };

      return pc;
    };

    const addPendingCandidates = async (peerId, pc) => {
      const candidates = pendingCandidatesRef.current.get(peerId) || [];
      pendingCandidatesRef.current.set(peerId, []);

      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Could not add ICE candidate:", error);
        }
      }
    };

    const onPeerJoined = ({ peerId, username }) => {
      if (!joinedRef.current) return;

      updateParticipant(peerId, {
        username: username || "Participant",
      });
    };

    const onPeerLeft = ({ peerId }) => {
      const pc = peerConnectionsRef.current.get(peerId);

      if (pc) {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.close();
      }

      peerConnectionsRef.current.delete(peerId);
      pendingCandidatesRef.current.delete(peerId);
      removeParticipant(peerId);

      if (joinedRef.current) {
        setStatus("Participant left the voice call");
      }
    };

    const onOffer = async ({ from, username, description }) => {
      if (!joinedRef.current || !from) return;

      try {
        const pc = createPeerConnection(
          from,
          username || "Participant"
        );

        await pc.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        await addPendingCandidates(from, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("voice:answer", {
          to: from,
          channelId,
          description: pc.localDescription,
        });
      } catch (error) {
        console.error("Could not answer voice call:", error);
        setStatus("Could not establish audio");
      }
    };

    const onAnswer = async ({ from, description }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        await addPendingCandidates(from, pc);
      } catch (error) {
        console.error("Could not process voice answer:", error);
      }
    };

    const onIceCandidate = async ({ from, candidate }) => {
      if (!joinedRef.current || !from || !candidate) return;

      const pc = peerConnectionsRef.current.get(from);

      // ICE candidates can arrive before the connection is ready.
      if (!pc || !pc.remoteDescription) {
        const queue = pendingCandidatesRef.current.get(from) || [];
        queue.push(candidate);
        pendingCandidatesRef.current.set(from, queue);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Could not add ICE candidate:", error);
      }
    };

    socket.on("voice:peer-joined", onPeerJoined);
    socket.on("voice:peer-left", onPeerLeft);
    socket.on("voice:offer", onOffer);
    socket.on("voice:answer", onAnswer);
    socket.on("voice:ice-candidate", onIceCandidate);

    startCallRef.current = async () => {
      if (joinedRef.current) return;

      if (!socket.connected) {
        setStatus("Real-time connection is not ready");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Microphone access is unavailable in this browser");
        return;
      }

      let stream;

      try {
        setStatus("Requesting microphone access...");

        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
          video: false,
        });

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        setStatus("Joining voice channel...");

        socket.emit("voice:join", channelId, async (result) => {
          if (disposed) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          if (!result?.ok) {
            stream.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
            setStatus(result?.message || "Could not join voice");
            return;
          }

          joinedRef.current = true;
          setIsJoined(true);
          setStatus("Joined voice channel; waiting for participants...");

          // Create a connection to every participant already in the room.
          const peers = result.peers || [];

          for (const peer of peers) {
            if (!peer?.peerId) continue;

            try {
              const pc = createPeerConnection(
                peer.peerId,
                peer.username || "Participant"
              );

              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);

              socket.emit("voice:offer", {
                to: peer.peerId,
                channelId,
                description: pc.localDescription,
              });
            } catch (error) {
              console.error(
                `Could not connect to participant ${peer.peerId}:`,
                error
              );
            }
          }
        });
      } catch (error) {
        console.error("Microphone access failed:", error);

        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        localStreamRef.current = null;

        setStatus(
          error.name === "NotAllowedError"
            ? "Microphone permission denied"
            : "Could not access microphone"
        );
      }
    };

    hangUpRef.current = () => {
      if (joinedRef.current) {
        socket.emit("voice:leave", channelId);
      }

      joinedRef.current = false;
      setIsJoined(false);

      peerConnectionsRef.current.forEach((pc) => {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.close();
      });

      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
      setRemoteParticipants([]);
      setIsMuted(false);
      setStatus("Not connected");
    };

    return () => {
      disposed = true;

      if (joinedRef.current) {
        socket.emit("voice:leave", channelId);
      }

      joinedRef.current = false;

      peerConnectionsRef.current.forEach((pc) => {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.close();
      });

      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;

      socket.off("voice:peer-joined", onPeerJoined);
      socket.off("voice:peer-left", onPeerLeft);
      socket.off("voice:offer", onOffer);
      socket.off("voice:answer", onAnswer);
      socket.off("voice:ice-candidate", onIceCandidate);

      startCallRef.current = null;
      hangUpRef.current = null;
    };
  }, [socket, channelId]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const nextMuted = !isMuted;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
  };

  return (
    <section className="voice-call-panel">
      <div className="voice-call-heading">
        <div className="voice-call-heading-icon">
          <Icon name="phone" size={19} />
        </div>

        <div className="voice-call-heading-copy">
          <h2>Voice channel</h2>
          <p>
            {isJoined
              ? "You're connected to the conversation"
              : "Connect and talk in real time"}
          </p>
        </div>

        <span
          className={`voice-call-status ${remoteParticipants.some((p) => p.connected)
              ? "is-connected"
              : ""
            }`}
        >
          <span />
          {remoteParticipants.some((p) => p.connected)
            ? "Connected"
            : isJoined
              ? "In voice"
              : "Ready"}
        </span>
      </div>

      <div className="voice-call-body">
        <div className="voice-call-participant">
          <div
            className={`voice-call-avatar ${isJoined ? "is-speaking" : ""
              }`}
          >
            <Icon name="audio-lines" size={28} />
          </div>

          <strong>You</strong>
          <span>
            {isMuted
              ? "Microphone muted"
              : isJoined
                ? "Your microphone"
                : "Not in voice"}
          </span>
        </div>

        {remoteParticipants.map((participant) => (
          <div
            className="voice-call-participant"
            key={participant.peerId}
          >
            <div
              className={`voice-call-avatar ${participant.connected ? "is-speaking" : ""
                }`}
            >
              <Icon name="user-round" size={28} />
            </div>

            <strong>{participant.username}</strong>
            <span>
              {participant.connected
                ? "Connected"
                : "Connecting…"}
            </span>

            {participant.stream && (
              <audio
                autoPlay
                playsInline
                ref={(element) => {
                  if (
                    element &&
                    element.srcObject !== participant.stream
                  ) {
                    element.srcObject = participant.stream;
                    element.play().catch(() => { });
                  }
                }}
              />
            )}
          </div>
        ))}

        {!isJoined && (
          <div className="voice-call-empty">
            <span className="voice-call-empty-icon">
              <Icon name="headphones" size={22} />
            </span>
            <strong>Ready when you are</strong>
            <p>Join the channel to start talking with others.</p>
          </div>
        )}

        {isJoined && remoteParticipants.length === 0 && (
          <div className="voice-call-empty">
            <span className="voice-call-empty-icon">
              <Icon name="headphones" size={22} />
            </span>
            <strong>You're in the voice channel</strong>
            <p>Other participants will appear here when they join.</p>
          </div>
        )}
      </div>

      <div className="voice-call-footer">
        <div className="voice-call-status-copy">
          <span className="voice-call-live-dot" />
          <span>{status}</span>
        </div>

        <div className="voice-call-controls">
          {!isJoined ? (
            <button
              type="button"
              className="voice-control-button voice-join-button"
              onClick={() => startCallRef.current?.()}
            >
              <Icon name="phone" size={17} />
              Join voice
            </button>
          ) : (
            <>
              <button
                type="button"
                className={`voice-control-button ${isMuted ? "voice-muted-button" : ""
                  }`}
                onClick={toggleMute}
                title={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                <Icon
                  name={isMuted ? "mic-off" : "mic"}
                  size={18}
                />
                {isMuted ? "Unmute" : "Mute"}
              </button>

              <button
                type="button"
                className="voice-control-button voice-leave-button"
                onClick={() => hangUpRef.current?.()}
              >
                <Icon name="phone-off" size={17} />
                Leave
              </button>
            </>
          )}
        </div>
      </div>

      <audio ref={localAudioRef} muted autoPlay />
    </section>
  );
}
