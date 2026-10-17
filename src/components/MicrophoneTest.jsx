
import { useState } from "react";

function MicrophoneTest() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");
  const [stream, setStream] = useState(null);

  async function startMicrophone() {
    try {
      setError("");

      const audioStream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

      setStream(audioStream);
      setIsActive(true);
    } catch (err) {
      console.error("Microphone error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Could not access the microphone. Check your device and browser settings."
      );
    }
  }

  function stopMicrophone() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setStream(null);
    setIsActive(false);
  }

  return (
    <div>
      <h2>Microphone Test</h2>

      <p>
        Status: {isActive ? "Microphone active" : "Microphone inactive"}
      </p>

      {!isActive ? (
        <button onClick={startMicrophone}>
          Start Microphone
        </button>
      ) : (
        <button onClick={stopMicrophone}>
          Stop Microphone
        </button>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default MicrophoneTest;