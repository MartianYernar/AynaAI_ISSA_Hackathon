import { useEffect, useRef, useState } from "react";

type CameraStatus = "loading" | "ready" | "fallback";

export function CameraBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("fallback");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1600 },
            height: { ideal: 900 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("ready");
      } catch {
        setStatus("fallback");
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className={`camera-background is-${status}`} aria-hidden="true">
      <video ref={videoRef} muted playsInline />
      <div className="camera-fallback">
        <span>Ayna AI Mirror</span>
        <strong>Camera preview unavailable</strong>
      </div>
      <div className="camera-readability-overlay" />
    </div>
  );
}
