"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Same shape as the workspace and Hybrid viewport cameras. */
export type TweenCamera = Readonly<{ yawDeg: number; pitchDeg: number; zoom: number; panX: number; panY: number }>;

/** Preset camera moves animate for this long; direct manipulation never animates. */
export const CAMERA_TWEEN_MS = 280;

/** Symmetric ease-in-out for on-screen movement (no overshoot). */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2;
}

/** Interpolates every camera field; yaw takes the shortest way round the circle. */
export function interpolateCamera(from: TweenCamera, to: TweenCamera, t: number): TweenCamera {
  const yawDelta = ((((to.yawDeg - from.yawDeg) % 360) + 540) % 360) - 180;
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    yawDeg: from.yawDeg + yawDelta * t,
    pitchDeg: lerp(from.pitchDeg, to.pitchDeg),
    zoom: lerp(from.zoom, to.zoom),
    panX: lerp(from.panX, to.panX),
    panY: lerp(from.panY, to.panY),
  };
}

function prefersInstantCamera(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
    || document.documentElement.dataset.input === "keyboard";
}

/**
 * Animates preset camera changes locally and commits once (#37).
 *
 * The tween runs in local state, so project state, history and persistence see exactly one camera change at the
 * end. A direct change (orbit, pan, zoom) or a new preset interrupts it and continues from the displayed camera,
 * so there is never a jump. Reduced motion and keyboard-initiated presets apply instantly.
 */
export function useCameraTween(committed: TweenCamera, commit: (camera: TweenCamera) => void) {
  const [displayed, setDisplayed] = useState<TweenCamera | null>(null);
  const frameRef = useRef<number | null>(null);
  const displayedRef = useRef<TweenCamera | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    displayedRef.current = null;
    setDisplayed(null);
  }, []);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const animateTo = useCallback((target: TweenCamera) => {
    const from = displayedRef.current ?? committed;
    if (prefersInstantCamera()) {
      stop();
      commit(target);
      return;
    }
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    // Mark the tween as started in the same update as the request, so `animating` is true from the click on
    // (not only from the first animation frame) and readers never mistake a mid-tween camera for the target.
    displayedRef.current = from;
    setDisplayed(from);
    const start = performance.now();
    const step = (now: number): void => {
      const progress = Math.min(1, (now - start) / CAMERA_TWEEN_MS);
      if (progress >= 1) {
        frameRef.current = null;
        displayedRef.current = null;
        setDisplayed(null);
        commit(target);
        return;
      }
      const next = interpolateCamera(from, target, easeInOutCubic(progress));
      displayedRef.current = next;
      setDisplayed(next);
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  }, [commit, committed, stop]);

  /** Direct manipulation: stop any tween and commit immediately. */
  const change = useCallback((camera: TweenCamera) => {
    stop();
    commit(camera);
  }, [commit, stop]);

  return { camera: displayed ?? committed, animating: displayed !== null, animateTo, change };
}
