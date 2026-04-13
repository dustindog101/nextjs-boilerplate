"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";

interface SignaturePadProps {
  onCommit: (file: File) => void;
  disabled?: boolean;
  className?: string;
  /** Tighter layout inside UploadSlot (taller touch canvas on small screens). */
  compact?: boolean;
  /** Reseller portal light theme uses a paper-like pad + dark ink. */
  appearance?: "dark" | "light";
}

/**
 * Finger/stylus-friendly signature capture (pointer events + touch-action: none).
 * Exports PNG for `prepareImageForUpload` → WebP pipeline.
 */
export function SignaturePad({
  onCommit,
  disabled,
  className = "",
  compact = false,
  appearance = "dark",
}: SignaturePadProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const hasInk = useRef(false);
  const [canSave, setCanSave] = useState(false);
  const sizeRef = useRef({ w: 320, h: 168 });

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const w = wrap.clientWidth;
    const h = compact ? 192 : 168;
    if (w < 40) return;
    sizeRef.current = { w, h };
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    const light = appearance === "light";
    /* Dark: zinc pad; Light: paper-like pad with dark ink */
    ctx.fillStyle = light ? "#f8fafc" : "#3f3f46";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = light ? "#0f172a" : "#09090b";
    ctx.lineWidth = compact ? 3 : 2.75;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    hasInk.current = false;
    setCanSave(false);
  }, [compact, appearance]);

  useLayoutEffect(() => {
    const tick = () => {
      const wrap = wrapRef.current;
      if (!wrap || wrap.clientWidth < 48) {
        requestAnimationFrame(tick);
        return;
      }
      setupCanvas();
    };
    tick();
  }, [setupCanvas]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = getPos(e);
    last.current = p;
    hasInk.current = true;
    setCanSave(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const endStroke = () => {
    drawing.current = false;
  };

  const clear = () => {
    setupCanvas();
  };

  const save = () => {
    if (!hasInk.current || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "signature.png", { type: "image/png" });
        onCommit(file);
      },
      "image/png",
      1
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <p
        className={`text-[11px] ${appearance === "light" ? "text-slate-600" : "text-zinc-500"} ${compact ? "text-center" : "text-center sm:text-left"}`}
      >
        {compact ? "Sign here with finger or stylus" : "Sign with your finger or stylus"}
      </p>
      <div
        ref={wrapRef}
        className={
          appearance === "light"
            ? "w-full rounded-xl border border-slate-300 bg-slate-100 overflow-hidden shadow-inner"
            : "w-full rounded-xl border border-white/[0.1] bg-[#3f3f46] overflow-hidden shadow-inner"
        }
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <canvas
          ref={canvasRef}
          className="block w-full touch-none cursor-crosshair select-none"
          style={{ touchAction: "none" }}
          aria-label="Draw your signature"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={(e) => {
            if (e.buttons === 0) endStroke();
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-between sm:gap-3">
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="btn btn-outline min-h-[44px] py-2.5 px-3 text-xs font-semibold rounded-xl"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          disabled={disabled || !canSave}
          className="btn btn-primary min-h-[44px] py-2.5 px-3 text-xs font-semibold rounded-xl disabled:opacity-40 sm:min-w-[9rem]"
        >
          Use signature
        </button>
      </div>
    </div>
  );
}
