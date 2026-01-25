"use client";

import { useCallback, useRef, useState, type TouchEvent } from "react";

export interface SwipeGestureOptions {
  /** Callback when swiped left */
  onSwipeLeft?: () => void;
  /** Callback when swiped right */
  onSwipeRight?: () => void;
  /** Minimum distance to trigger swipe (default: 50px) */
  threshold?: number;
  /** Whether swipe is enabled */
  enabled?: boolean;
}

export interface SwipeGestureState {
  /** Current offset (for visual feedback) */
  offset: number;
  /** Whether user is currently swiping */
  isSwiping: boolean;
  /** Touch event handlers to attach to element */
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
  };
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: SwipeGestureOptions): SwipeGestureState {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      if (!touch) return;

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      isHorizontalSwipe.current = null;
      setIsSwiping(true);
    },
    [enabled],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !isSwiping) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;

      // Determine if this is a horizontal or vertical swipe on first significant move
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      // Only track horizontal swipes
      if (isHorizontalSwipe.current) {
        // Limit offset range to provide resistance at edges
        const maxOffset = 100;
        const clampedOffset = Math.max(
          -maxOffset,
          Math.min(maxOffset, deltaX * 0.5),
        );
        setOffset(clampedOffset);
      }
    },
    [enabled, isSwiping],
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX.current;

      // Only trigger actions for horizontal swipes
      if (isHorizontalSwipe.current) {
        if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > threshold && onSwipeRight) {
          onSwipeRight();
        }
      }

      // Reset state
      setOffset(0);
      setIsSwiping(false);
      isHorizontalSwipe.current = null;
    },
    [enabled, threshold, onSwipeLeft, onSwipeRight],
  );

  return {
    offset,
    isSwiping,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
