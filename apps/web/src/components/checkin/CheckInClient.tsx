"use client";

import { useEffect, useRef, useState } from "react";
import type { CheckInResponse, Dictionary, EventItem } from "@gibtu/shared";

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
}

interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

interface CheckInClientProps {
  events: EventItem[];
  dict: Dictionary["checkIn"];
}

export function CheckInClient({ events, dict }: CheckInClientProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id ?? "");
  const [qrToken, setQrToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  function stopCamera() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function submitCheckIn(tokenValue: string) {
    if (!selectedEventId || !tokenValue.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/portal/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          qrToken: tokenValue.trim(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | CheckInResponse
        | { error?: { message?: string } };

      if (!response.ok) {
        const message =
          "error" in payload && payload.error?.message
            ? payload.error.message
            : "Bilet doğrulanamadı.";
        setError(message);
        return;
      }

      setResult(payload as CheckInResponse);
      setQrToken("");
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startCamera() {
    setCameraNotice(null);
    setError(null);

    const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
      .BarcodeDetector;

    if (!ctor || !navigator.mediaDevices?.getUserMedia) {
      setCameraNotice(dict.cameraUnsupported);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new ctor({ formats: ["qr_code"] });
      timerRef.current = window.setInterval(() => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          return;
        }
        void detector
          .detect(video)
          .then((codes) => {
            const firstCode = codes[0]?.rawValue?.trim();
            if (firstCode) {
              stopCamera();
              setQrToken(firstCode);
              void submitCheckIn(firstCode);
            }
          })
          .catch(() => {
            // Ignore transient frame detection errors
          });
      }, 450);
    } catch {
      stopCamera();
      setCameraNotice(dict.cameraUnsupported);
    }
  }

  if (events.length === 0) {
    return (
      <div className="border border-border bg-surface p-8 text-center text-sm text-muted">
        {dict.noManageableEvents}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-border bg-surface p-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              {dict.selectEventLabel}
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
            >
              {events.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitCheckIn(qrToken);
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {dict.tokenInputLabel}
              </label>
              <input
                type="text"
                required
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder={dict.tokenInputPlaceholder}
                className="w-full border border-border bg-paper px-3 py-2 font-mono text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting || !qrToken.trim()}
                className="border border-navy bg-navy px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-navy/90 disabled:opacity-60"
              >
                {submitting ? dict.verifyingButton : dict.verifyButton}
              </button>

              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="border border-border bg-paper px-4 py-2 text-sm font-medium text-navy hover:border-navy"
                >
                  {dict.cameraScanButton}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="border border-brass bg-paper px-4 py-2 text-sm font-medium text-navy"
                >
                  {dict.cameraStopButton}
                </button>
              )}
            </div>
          </form>

          {cameraNotice && (
            <p className="border border-border bg-paper px-4 py-2 text-xs text-muted">
              {cameraNotice}
            </p>
          )}

          {cameraActive && (
            <div className="overflow-hidden border border-border bg-paper p-2">
              <video
                ref={videoRef}
                muted
                playsInline
                className="mx-auto max-h-72 w-full max-w-md object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`border px-5 py-4 ${
            result.result === "checked_in"
              ? "border-sage bg-surface text-navy"
              : "border-brass bg-surface text-navy"
          }`}
        >
          <p className="text-sm font-semibold">
            {result.result === "checked_in"
              ? dict.checkedInSuccess
              : dict.alreadyCheckedInNotice}
          </p>
          <p className="mt-1 text-sm text-ink">
            {result.attendeeName} · {result.attendeeDepartment}
          </p>
          <p className="mt-1 text-xs text-muted">
            {new Date(result.checkedInAt).toLocaleString("tr-TR")}
          </p>
        </div>
      )}
    </div>
  );
}
