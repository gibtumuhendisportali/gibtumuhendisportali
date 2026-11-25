"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QrCodeCanvasProps {
  token: string;
  label: string;
  copyLabel: string;
}

export function QrCodeCanvas({ token, label, copyLabel }: QrCodeCanvasProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(token, {
      width: 220,
      margin: 1,
      color: {
        dark: "#192C40",
        light: "#FAF9F5",
      },
    }).then((url) => {
      if (active) {
        setDataUrl(url);
      }
    });
    return () => {
      active = false;
    };
  }, [token]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 border border-border bg-paper p-4">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={label}
          width={200}
          height={200}
          className="h-44 w-44 border border-border bg-surface p-1"
        />
      ) : (
        <div className="flex h-44 w-44 items-center justify-center border border-border bg-surface text-xs text-muted">
          QR...
        </div>
      )}
      <code className="max-w-full break-all text-center font-mono text-[11px] text-muted">
        {token}
      </code>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="border border-border bg-surface px-3 py-1 text-xs font-medium text-navy hover:border-navy"
      >
        {copied ? "✓" : copyLabel}
      </button>
    </div>
  );
}
