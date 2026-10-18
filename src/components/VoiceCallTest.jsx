import { useEffect, useRef, useState } from "react";
import { sounds } from "../utils/audioEffects";

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
    "headphones-off": (
      <>
        <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
        <path d="M5 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2ZM19 14h-2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2Z" />
        <path d="m2 2 20 20" />
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
    video: (
      <>
        <rect x="3" y="5" width="13" height="14" rx="3" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),
    "video-off": (
      <>
        <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8M2 2l20 20M3 7.8A2 2 0 0 0 2 9v7a2 2 0 0 0 2 2h10a2 2 0 0 0 1.73-1" />
      </>
    ),
    screen: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    "screen-off": (
      <>
        <path d="M1 1l22 22M4 4H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16M8 21h8M12 17v4" />
      </>
    ),
    maximize: (
      <>
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
      </>
    ),
    minimize: (
      <>
        <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
      </>
    ),
    flip: (
      <>
        <path d="M8 3 4 7l4 4" />
        <path d="M4 7h16" />
        <path d="m16 21 4-4-4-4" />
        <path d="M20 17H4" />
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

// Isolated audio stream component to prevent React re-renders from re-triggering playback
function RemoteAudioStream({ stream, isDeafened }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    el.muted = Boolean(isDeafened);
    el.play().catch(() => {});
  }, [stream, isDeafened]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

// Ensure Opus audio codec keeps transmitting (disable DTX which cuts off quiet speech/syllables)
const optimizeSdp = (sdp) => {
  if (!sdp) return sdp;
  return sdp.replace(/a=fmtp:(\d+) (.*)/g, (match, pt, params) => {
    if (params.includes("opus") || pt === "111") {
      let updated = params;
      if (!updated.includes("usedtx=")) {
        updated += ";usedtx=0";
      } else {
        updated = updated.replace(/usedtx=1/g, "usedtx=0");
      }
      return `a=fmtp:${pt} ${updated}`;
    }
    return match;
  });
};

// Web Audio API hook to detect voice activity in real time
function useAudioActivity(stream, isMuted = false) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || isMuted) {
      setIsSpeaking(false);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length || !audioTracks[0].enabled) {
      setIsSpeaking(false);
      return;
    }

    let audioContext;
    let analyser;
    let source;
    let animationFrameId;
    let speakingTimeout = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      audioContext = new AudioCtx();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.4;

      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const sampleVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        if (avg > 16) {
          setIsSpeaking(true);
          clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => {
            setIsSpeaking(false);
          }, 350);
        }

        animationFrameId = requestAnimationFrame(sampleVolume);
      };

      sampleVolume();
    } catch {
      // AudioContext initialization fallback
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(speakingTimeout);
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
      setIsSpeaking(false);
    };
  }, [stream, isMuted]);

  return isSpeaking;
}

// ParticipantCard displays video stream or audio avatar with live speaking indicator & maximize option
function ParticipantCard({
  username,
  stream,
  isLocal = false,
  isMuted = false,
  isDeafened = false,
  connected = true,
  videoTrack = null,
  isScreenSharing = false,
  isScreen = false,
  hasVideoSignaled = false,
  onMaximize = null,
}) {
  const isSpeaking = useAudioActivity(stream, isMuted);
  const [hasRemoteTrack, setHasRemoteTrack] = useState(false);
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);

  // Monitor remote video tracks
  useEffect(() => {
    if (isLocal) return;
    if (!stream) {
      setHasRemoteTrack(false);
      return;
    }

    const checkTracks = () => {
      const vTracks = stream.getVideoTracks();
      const hasLiveTrack = vTracks.length > 0 && vTracks.some((t) => t.readyState === "live" && !t.muted);
      setHasRemoteTrack(hasLiveTrack);
    };

    checkTracks();

    const vTracks = stream.getVideoTracks();
    vTracks.forEach((t) => {
      t.onmute = checkTracks;
      t.onunmute = checkTracks;
      t.onended = checkTracks;
    });

    stream.onaddtrack = checkTracks;
    stream.onremovetrack = checkTracks;

    return () => {
      stream.onaddtrack = null;
      stream.onremovetrack = null;
      vTracks.forEach((t) => {
        t.onmute = null;
        t.onunmute = null;
        t.onended = null;
      });
    };
  }, [stream, isLocal]);

  const showVideo = isLocal
    ? Boolean(videoTrack)
    : (hasRemoteTrack || hasVideoSignaled || (stream && stream.getVideoTracks().length > 0));

  // Reliably assign stream without re-creating MediaStream or re-attaching on unchanged renders
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isLocal) {
      if (videoTrack) {
        if (!localStreamRef.current || localStreamRef.current.getVideoTracks()[0] !== videoTrack) {
          localStreamRef.current = new MediaStream([videoTrack]);
        }
        if (el.srcObject !== localStreamRef.current) {
          el.srcObject = localStreamRef.current;
        }
        el.play().catch(() => {});
      } else {
        el.srcObject = null;
      }
    } else {
      if (stream && showVideo) {
        if (el.srcObject !== stream) {
          el.srcObject = stream;
        }
        el.play().catch(() => {});
      } else {
        el.srcObject = null;
      }
    }
  }, [showVideo, isLocal, videoTrack, stream]);

  // Permanently invert/mirror all camera views on both local and remote, while screen sharing remains normal
  const isCamera = isLocal ? !isScreenSharing : !isScreen;

  return (
    <div className={`voice-call-participant ${showVideo ? "has-video" : ""}`}>
      {showVideo ? (
        <div className={`voice-call-video-wrapper ${isSpeaking ? "is-speaking" : ""}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`voice-call-video ${isCamera ? "is-mirrored" : ""}`}
          />

          <div className="voice-call-video-topbar">
            {onMaximize && (
              <button
                type="button"
                className="video-maximize-btn"
                onClick={onMaximize}
                title="Full size video / screen share"
                aria-label="Maximize video"
              >
                <Icon name="maximize" size={14} />
              </button>
            )}
          </div>

          <span className="voice-call-video-overlay">
            {username} {isMuted && "🔇"}
          </span>
        </div>
      ) : (
        <div className={`voice-call-avatar ${isSpeaking ? "is-speaking" : ""}`}>
          <Icon name={isLocal ? "audio-lines" : "user-round"} size={28} />
        </div>
      )}

      <strong>{username}</strong>
      <span>
        {isMuted
          ? "Microphone muted"
          : isSpeaking
          ? "Speaking..."
          : connected
          ? (isLocal ? "Your microphone" : (showVideo ? "Video / Screen" : "Connected"))
          : "Connecting..."}
      </span>

      {!isLocal && stream && <RemoteAudioStream stream={stream} isDeafened={isDeafened} />}
    </div>
  );
}

// Fullscreen video viewer with stable stream assignment to prevent flickering
function FullscreenVideoPlayer({ isLocal, videoTrack, stream, isScreen = false }) {
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isLocal) {
      if (videoTrack) {
        if (!localStreamRef.current || localStreamRef.current.getVideoTracks()[0] !== videoTrack) {
          localStreamRef.current = new MediaStream([videoTrack]);
        }
        if (el.srcObject !== localStreamRef.current) {
          el.srcObject = localStreamRef.current;
        }
        el.play().catch(() => {});
      } else {
        el.srcObject = null;
      }
    } else {
      if (stream) {
        if (el.srcObject !== stream) {
          el.srcObject = stream;
        }
        el.play().catch(() => {});
      } else {
        el.srcObject = null;
      }
    }
  }, [isLocal, videoTrack, stream]);

  // Permanently invert/mirror camera views in fullscreen as well
  const isCamera = !isScreen;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`video-fullscreen-player ${isCamera ? "is-mirrored" : ""}`}
    />
  );
}

export default function VoiceCallTest({ socket, channelId, initialMode = "voice", onClose }) {
  const [status, setStatus] = useState("Not connected");
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [fullscreenData, setFullscreenData] = useState(null);

  const localAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoTrackRef = useRef(null);

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && fullscreenData) {
        setFullscreenData(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenData]);

  // If fullscreen participant stops video, close fullscreen
  useEffect(() => {
    if (!fullscreenData) return;
    if (fullscreenData.isLocal && !localVideoTrack) {
      setFullscreenData(null);
    }
  }, [localVideoTrack, fullscreenData]);

  // Each participant gets their own connection and ICE candidate queue.
  const peerConnectionsRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const joinedRef = useRef(false);
  const startCallRef = useRef(null);
  const hangUpRef = useRef(null);
  const autoStartedRef = useRef(false);

  // Auto-start call directly on mount based on initialMode
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    const timer = setTimeout(() => {
      startCallRef.current?.(initialMode === "video");
    }, 60);
    return () => clearTimeout(timer);
  }, [initialMode]);

  // Propagates video track changes across all WebRTC peer connections and triggers renegotiation
  const updateVideoTracksOnPeers = async (newTrack, isScreen = false) => {
    socket?.emit("voice:video-toggle", {
      channelId,
      hasVideo: Boolean(newTrack),
      isScreen: Boolean(isScreen),
    });

    for (const [peerId, pc] of peerConnectionsRef.current.entries()) {
      if (!pc || pc.signalingState === "closed") continue;

      try {
        let videoTransceiver = pc.getTransceivers().find(
          (t) => t.sender.track?.kind === "video" || t.receiver.track?.kind === "video"
        );

        if (videoTransceiver) {
          videoTransceiver.direction = newTrack ? "sendrecv" : "recvonly";
          await videoTransceiver.sender.replaceTrack(newTrack);
        } else if (newTrack) {
          pc.addTrack(newTrack, localStreamRef.current || new MediaStream());
        }

        // Renegotiate with peer if connection is in stable state
        if (pc.signalingState === "stable") {
          const offer = await pc.createOffer();
          if (offer.sdp) offer.sdp = optimizeSdp(offer.sdp);
          await pc.setLocalDescription(offer);
          socket.emit("voice:offer", {
            to: peerId,
            channelId,
            description: pc.localDescription,
          });
        }
      } catch (err) {
        console.warn("Failed to update video track on peer:", peerId, err);
      }
    }
  };

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
            hasVideoSignaled: false,
            ...changes,
          },
        ];
      });
    };

    const syncPeerMedia = (peerId, customUsername) => {
      const pc = peerConnectionsRef.current.get(peerId);
      if (!pc) return;

      let peerStream = remoteStreamsRef.current.get(peerId);
      if (!peerStream) {
        peerStream = new MediaStream();
        remoteStreamsRef.current.set(peerId, peerStream);
      }

      // Collect all incoming tracks from all receivers
      const receivers = pc.getReceivers();
      for (const receiver of receivers) {
        const track = receiver.track;
        if (track) {
          if (!peerStream.getTracks().some((t) => t.id === track.id)) {
            peerStream.addTrack(track);
          }
          track.onunmute = () => syncPeerMedia(peerId);
          track.onmute = () => syncPeerMedia(peerId);
          track.onended = () => syncPeerMedia(peerId);
        }
      }

      const hasLiveVideo = peerStream.getVideoTracks().some(
        (t) => t.readyState === "live" && !t.muted
      );

      setRemoteParticipants((prev) => {
        const existing = prev.find((p) => p.peerId === peerId);
        const name = customUsername || existing?.username || "Participant";
        if (existing) {
          return prev.map((p) =>
            p.peerId === peerId
              ? {
                  ...p,
                  username: name,
                  stream: peerStream,
                  connected: pc.connectionState === "connected",
                  hasVideoSignaled: hasLiveVideo ? true : p.hasVideoSignaled,
                }
              : p
          );
        }

        return [
          ...prev,
          {
            peerId,
            username: name,
            stream: peerStream,
            connected: pc.connectionState === "connected",
            hasVideoSignaled: hasLiveVideo,
          },
        ];
      });
    };

    const removeParticipant = (peerId) => {
      setRemoteParticipants((previous) =>
        previous.filter((p) => p.peerId !== peerId)
      );
    };

    const createPeerConnection = (peerId, username = "Participant", isInitiator = false) => {
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

      let peerStream = remoteStreamsRef.current.get(peerId);
      if (!peerStream) {
        peerStream = new MediaStream();
        remoteStreamsRef.current.set(peerId, peerStream);
      }

      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Add local video track if enabled, or prepare video transceiver
      if (localVideoTrackRef.current) {
        pc.addTrack(localVideoTrackRef.current, localStreamRef.current || new MediaStream());
      } else {
        try {
          pc.addTransceiver("video", { direction: "sendrecv" });
        } catch {
          // Fallback
        }
      }

      updateParticipant(peerId, { username, stream: peerStream });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("voice:ice-candidate", {
            to: peerId,
            channelId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = () => {
        syncPeerMedia(peerId, username);
      };

      pc.onconnectionstatechange = () => {
        if (peerConnectionsRef.current.get(peerId) !== pc) return;

        if (pc.connectionState === "connected") {
          updateParticipant(peerId, {
            username,
            connected: true,
          });
          syncPeerMedia(peerId, username);
          setStatus("Voice & media connected");
        } else if (pc.connectionState === "connecting") {
          updateParticipant(peerId, { connected: false });
          setStatus("Connecting media...");
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          updateParticipant(peerId, { connected: false });
        } else if (pc.connectionState === "disconnected") {
          updateParticipant(peerId, { connected: false });
          setStatus("Media connection interrupted");
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
      const peerStream = remoteStreamsRef.current.get(peerId);
      if (peerStream) {
        peerStream.getTracks().forEach((t) => t.stop());
        remoteStreamsRef.current.delete(peerId);
      }
      removeParticipant(peerId);

      if (joinedRef.current) {
        setStatus("Participant left the call");
      }
    };

    const onOffer = async ({ from, username, description }) => {
      if (!joinedRef.current || !from) return;

      try {
        const pc = createPeerConnection(
          from,
          username || "Participant",
          false
        );

        await pc.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        await addPendingCandidates(from, pc);
        syncPeerMedia(from, username);

        const answer = await pc.createAnswer();
        if (answer.sdp) {
          answer.sdp = optimizeSdp(answer.sdp);
        }
        await pc.setLocalDescription(answer);

        socket.emit("voice:answer", {
          to: from,
          channelId,
          description: pc.localDescription,
        });

        syncPeerMedia(from, username);
      } catch (error) {
        console.error("Could not answer call:", error);
        setStatus("Could not establish media");
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
        syncPeerMedia(from);
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

    const onVideoToggle = ({ peerId, hasVideo, isScreen }) => {
      syncPeerMedia(peerId);
      updateParticipant(peerId, { hasVideoSignaled: Boolean(hasVideo), isScreen: Boolean(isScreen) });
    };

    socket.on("voice:peer-joined", onPeerJoined);
    socket.on("voice:peer-left", onPeerLeft);
    socket.on("voice:offer", onOffer);
    socket.on("voice:answer", onAnswer);
    socket.on("voice:ice-candidate", onIceCandidate);
    socket.on("voice:video-toggle", onVideoToggle);

    startCallRef.current = async (enableVideo = false) => {
      if (joinedRef.current) return;

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Microphone access is unavailable in this browser");
        return;
      }

      let stream;

      try {
        setStatus(enableVideo ? "Starting video call..." : "Starting voice call...");

        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: false,
        });

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;

        // Directly acquire video if video mode was requested
        let vTrack = null;
        if (enableVideo) {
          try {
            const vStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 } },
            });
            if (disposed) {
              vStream.getTracks().forEach((t) => t.stop());
            } else {
              vTrack = vStream.getVideoTracks()[0];
              if (vTrack) {
                localVideoTrackRef.current = vTrack;
                setLocalVideoTrack(vTrack);
                setIsVideoOn(true);

                vTrack.onended = () => {
                  setIsVideoOn(false);
                  setLocalVideoTrack(null);
                  localVideoTrackRef.current = null;
                  updateVideoTracksOnPeers(null);
                };
              }
            }
          } catch (camErr) {
            console.warn("Could not access camera for video call:", camErr);
            setStatus("Microphone connected; camera access denied");
          }
        }

        setStatus("Joining voice & video channel...");

        socket.emit("voice:join", channelId, async (result) => {
          if (disposed) {
            stream.getTracks().forEach((track) => track.stop());
            if (vTrack) vTrack.stop();
            return;
          }

          if (!result?.ok) {
            stream.getTracks().forEach((track) => track.stop());
            if (vTrack) vTrack.stop();
            localStreamRef.current = null;
            localVideoTrackRef.current = null;
            setLocalVideoTrack(null);
            setIsVideoOn(false);
            setStatus(result?.message || "Could not join voice");
            return;
          }

          joinedRef.current = true;
          setIsJoined(true);
          sounds.playJoinSound();
          setStatus("Connected to channel; waiting for participants...");

          if (vTrack) {
            socket.emit("voice:video-toggle", {
              channelId,
              hasVideo: true,
              isScreen: false,
            });
          }

          // Create an initiating connection to every participant already in the room.
          const peers = result.peers || [];

          for (const peer of peers) {
            if (!peer?.peerId) continue;

            try {
              const pc = createPeerConnection(
                peer.peerId,
                peer.username || "Participant",
                true
              );

              const offer = await pc.createOffer();
              if (offer.sdp) {
                offer.sdp = optimizeSdp(offer.sdp);
              }
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
      sounds.playLeaveSound();
      if (joinedRef.current) {
        socket.emit("voice:leave", channelId);
      }

      joinedRef.current = false;
      setIsJoined(false);
      setIsDeafened(false);
      setFullscreenData(null);

      peerConnectionsRef.current.forEach((pc) => {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.close();
      });

      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();

      remoteStreamsRef.current.forEach((st) => {
        st.getTracks().forEach((t) => t.stop());
      });
      remoteStreamsRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current = null;
      }

      localStreamRef.current = null;
      setLocalVideoTrack(null);
      setIsVideoOn(false);
      setIsScreenSharing(false);
      setRemoteParticipants([]);
      setIsMuted(false);
      setStatus("Not connected");
      onClose?.();
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

      remoteStreamsRef.current.forEach((st) => {
        st.getTracks().forEach((t) => t.stop());
      });
      remoteStreamsRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current = null;
      }

      localStreamRef.current = null;

      socket.off("voice:peer-joined", onPeerJoined);
      socket.off("voice:peer-left", onPeerLeft);
      socket.off("voice:offer", onOffer);
      socket.off("voice:answer", onAnswer);
      socket.off("voice:ice-candidate", onIceCandidate);
      socket.off("voice:video-toggle", onVideoToggle);

      startCallRef.current = null;
      hangUpRef.current = null;
    };
  }, [socket, channelId]);

  useEffect(() => {
    if (!isJoined) {
      setCallSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isJoined]);

  const formatCallTime = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const nextMuted = !isMuted;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted && !isDeafened;
    });

    setIsMuted(nextMuted);
    sounds.playMuteSound(nextMuted);
  };

  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);
    sounds.playDeafenSound(nextDeafened);
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !nextDeafened && !isMuted;
      });
    }
  };

  const toggleVideo = async () => {
    if (!joinedRef.current) return;

    if (isVideoOn) {
      if (localVideoTrackRef.current && !isScreenSharing) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current = null;
      }
      setLocalVideoTrack(null);
      setIsVideoOn(false);
      await updateVideoTracksOnPeers(null);
    } else {
      try {
        if (isScreenSharing && localVideoTrackRef.current) {
          localVideoTrackRef.current.stop();
          setIsScreenSharing(false);
        }

        const vStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 } },
        });
        const vTrack = vStream.getVideoTracks()[0];
        localVideoTrackRef.current = vTrack;
        setLocalVideoTrack(vTrack);
        setIsVideoOn(true);

        vTrack.onended = () => {
          setIsVideoOn(false);
          setLocalVideoTrack(null);
          localVideoTrackRef.current = null;
          updateVideoTracksOnPeers(null, false);
        };

        await updateVideoTracksOnPeers(vTrack, false);
      } catch (err) {
        console.error("Camera access failed:", err);
        setStatus("Could not access camera");
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!joinedRef.current) return;

    if (isScreenSharing) {
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current = null;
      }
      setLocalVideoTrack(null);
      setIsScreenSharing(false);
      await updateVideoTracksOnPeers(null, false);
    } else {
      try {
        if (isVideoOn && localVideoTrackRef.current) {
          localVideoTrackRef.current.stop();
          setIsVideoOn(false);
        }

        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        const sTrack = sStream.getVideoTracks()[0];
        localVideoTrackRef.current = sTrack;
        setLocalVideoTrack(sTrack);
        setIsScreenSharing(true);

        sTrack.onended = () => {
          setIsScreenSharing(false);
          setLocalVideoTrack(null);
          localVideoTrackRef.current = null;
          updateVideoTracksOnPeers(null, false);
        };

        await updateVideoTracksOnPeers(sTrack, true);
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  return (
    <section className="voice-call-panel">
      <div className="voice-call-heading">
        <div className="voice-call-heading-icon">
          <Icon name="phone" size={19} />
        </div>

        <div className="voice-call-heading-copy">
          <h2>Voice & video channel</h2>
          <p>
            {isJoined
              ? "You're connected to the conversation"
              : "Connect, talk, and share your screen in real time"}
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
            ? `Connected · ${formatCallTime(callSeconds)}`
            : isJoined
              ? `In call · ${formatCallTime(callSeconds)}`
              : "Ready"}
        </span>
      </div>

      <div className="voice-call-body">
        <ParticipantCard
          username="You"
          stream={localStreamRef.current}
          isLocal={true}
          isMuted={isMuted}
          isDeafened={isDeafened}
          connected={isJoined}
          videoTrack={localVideoTrack}
          isScreenSharing={isScreenSharing}
          onMaximize={localVideoTrack ? () => setFullscreenData({
            username: "You",
            stream: null,
            videoTrack: localVideoTrack,
            isLocal: true,
            isScreen: isScreenSharing,
          }) : null}
        />

        {remoteParticipants.map((participant) => (
          <ParticipantCard
            key={participant.peerId}
            username={participant.username}
            stream={participant.stream}
            isLocal={false}
            isMuted={false}
            isDeafened={isDeafened}
            connected={participant.connected}
            isScreen={participant.isScreen}
            hasVideoSignaled={participant.hasVideoSignaled}
            onMaximize={
              participant.stream?.getVideoTracks()?.length > 0 || participant.hasVideoSignaled
                ? () => setFullscreenData({
                    username: participant.username,
                    stream: participant.stream,
                    videoTrack: null,
                    isLocal: false,
                    isScreen: participant.isScreen,
                  })
                : null
            }
          />
        ))}

        {!isJoined && (
          <div className="voice-call-empty">
            <span className="voice-call-empty-icon">
              <Icon name="headphones" size={22} />
            </span>
            <strong>Ready when you are</strong>
            <p>Join the channel to start talking, video calling, or sharing your screen.</p>
          </div>
        )}

        {isJoined && remoteParticipants.length === 0 && (
          <div className="voice-call-empty">
            <span className="voice-call-empty-icon">
              <Icon name="headphones" size={22} />
            </span>
            <strong>You're in the channel</strong>
            <p>Turn on your camera or share your screen. Others will appear here when they join.</p>
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
              Join call
            </button>
          ) : (
            <>
              <button
                type="button"
                className={`voice-control-button ${isMuted ? "voice-muted-button" : ""}`}
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
                className={`voice-control-button ${isDeafened ? "voice-muted-button" : ""}`}
                onClick={toggleDeafen}
                title={isDeafened ? "Undeafen audio" : "Deafen audio"}
              >
                <Icon
                  name={isDeafened ? "headphones-off" : "headphones"}
                  size={18}
                />
                {isDeafened ? "Undeafen" : "Deafen"}
              </button>

              <button
                type="button"
                className={`voice-control-button ${isVideoOn ? "voice-active-button" : ""}`}
                onClick={toggleVideo}
                title={isVideoOn ? "Turn camera off" : "Turn camera on"}
              >
                <Icon
                  name={isVideoOn ? "video-off" : "video"}
                  size={18}
                />
                {isVideoOn ? "Camera on" : "Camera"}
              </button>

              <button
                type="button"
                className={`voice-control-button ${isScreenSharing ? "voice-active-button" : ""}`}
                onClick={toggleScreenShare}
                title={isScreenSharing ? "Stop sharing screen" : "Share your screen"}
              >
                <Icon
                  name={isScreenSharing ? "screen-off" : "screen"}
                  size={18}
                />
                {isScreenSharing ? "Sharing" : "Screen"}
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

      {/* Fullscreen / Theater Video Modal */}
      {fullscreenData && (
        <div className="video-fullscreen-modal" onClick={() => setFullscreenData(null)}>
          <div className="video-fullscreen-container" onClick={(e) => e.stopPropagation()}>
            <div className="video-fullscreen-header">
              <div className="video-fullscreen-title">
                <span className="live-pill">LIVE</span>
                <h3>{fullscreenData.username}</h3>
                <span>{fullscreenData.isLocal ? "(Your stream)" : "Screen / Video Stream"}</span>
              </div>
              <div className="video-fullscreen-actions">
                <button
                  type="button"
                  className="video-fullscreen-icon-btn"
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    } else {
                      document.exitFullscreen().catch(() => {});
                    }
                  }}
                  title="Toggle native fullscreen"
                >
                  <Icon name="maximize" size={16} />
                </button>
                <button
                  type="button"
                  className="video-fullscreen-close-btn"
                  onClick={() => setFullscreenData(null)}
                  title="Exit full size (Esc)"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="video-fullscreen-stage">
              <FullscreenVideoPlayer
                isLocal={fullscreenData.isLocal}
                videoTrack={fullscreenData.videoTrack}
                stream={fullscreenData.stream}
                isScreen={fullscreenData.isScreen}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
