import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface AdaptiveCenteringConfig {
  headerHeight: number;
  footerHeight: number;
  maxHeaderPadding: number;
  maxFooterPadding: number;
  minHeaderPadding: number;
  minFooterPadding: number;
  maxContentPadding: number;
  minContentPadding: number;
}

interface LayoutState {
  mode: 'centered' | 'scroll';
  headerPadding: number;
  footerPadding: number;
  contentPadding: number;
}

const DEFAULT_CONFIG: AdaptiveCenteringConfig = {
  headerHeight: 60,
  footerHeight: 40,
  maxHeaderPadding: 32,
  maxFooterPadding: 32,
  minHeaderPadding: 16,
  minFooterPadding: 16,
  maxContentPadding: 48,
  minContentPadding: 16,
};

function lerp(min: number, max: number, ratio: number): number {
  return min + (max - min) * Math.max(0, Math.min(1, ratio));
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function useAdaptiveCentering(
  config: Partial<AdaptiveCenteringConfig> = {},
  isContentReady: boolean = true
) {
  const fullConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [layoutState, setLayoutState] = useState<LayoutState>({
    mode: 'centered',
    headerPadding: fullConfig.maxHeaderPadding,
    footerPadding: fullConfig.maxFooterPadding,
    contentPadding: fullConfig.maxContentPadding,
  });

  const [isCalculating, setIsCalculating] = useState(true);

  const calculateLayout = useCallback(() => {
    const headerEl = headerRef.current;
    const contentEl = contentRef.current;
    const footerEl = footerRef.current;

    if (!contentEl) {
      return null;
    }

    // Measure actual element heights
    const headerHeight = headerEl?.offsetHeight || fullConfig.headerHeight;
    const contentHeight = contentEl.scrollHeight;
    const footerHeight = footerEl?.offsetHeight || fullConfig.footerHeight;

    // Get dynamic viewport height (accounts for mobile browser UI)
    const viewportHeight = window.innerHeight;

    // Calculate minimum total height with minimum spacing
    const minTotalHeight =
      headerHeight +
      (fullConfig.minHeaderPadding * 2) +
      contentHeight +
      (fullConfig.minContentPadding * 2) +
      (fullConfig.minFooterPadding * 2) +
      footerHeight;

    // Content doesn't fit even with minimum spacing - use scroll mode
    if (minTotalHeight > viewportHeight) {
      return {
        mode: 'scroll' as const,
        headerPadding: fullConfig.minHeaderPadding,
        footerPadding: fullConfig.minFooterPadding,
        contentPadding: fullConfig.minContentPadding,
      };
    }

    // Calculate maximum total height with maximum spacing
    const maxTotalHeight =
      headerHeight +
      (fullConfig.maxHeaderPadding * 2) +
      contentHeight +
      (fullConfig.maxContentPadding * 2) +
      (fullConfig.maxFooterPadding * 2) +
      footerHeight;

    // Content fits with maximum spacing - use ideal centered layout
    if (maxTotalHeight <= viewportHeight) {
      return {
        mode: 'centered' as const,
        headerPadding: fullConfig.maxHeaderPadding,
        footerPadding: fullConfig.maxFooterPadding,
        contentPadding: fullConfig.maxContentPadding,
      };
    }

    // Content fits but needs reduced spacing - scale proportionally
    const fixedHeight = headerHeight + contentHeight + footerHeight;
    const availableForSpacing = viewportHeight - fixedHeight;

    const totalMaxSpacing =
      (fullConfig.maxHeaderPadding * 2) +
      (fullConfig.maxContentPadding * 2) +
      (fullConfig.maxFooterPadding * 2);
    const totalMinSpacing =
      (fullConfig.minHeaderPadding * 2) +
      (fullConfig.minContentPadding * 2) +
      (fullConfig.minFooterPadding * 2);

    // Scale ratio between min and max
    const ratio = (availableForSpacing - totalMinSpacing) / (totalMaxSpacing - totalMinSpacing);

    return {
      mode: 'centered' as const,
      headerPadding: Math.round(lerp(fullConfig.minHeaderPadding, fullConfig.maxHeaderPadding, ratio)),
      footerPadding: Math.round(lerp(fullConfig.minFooterPadding, fullConfig.maxFooterPadding, ratio)),
      contentPadding: Math.round(lerp(fullConfig.minContentPadding, fullConfig.maxContentPadding, ratio)),
    };
  }, [fullConfig]);

  useEffect(() => {
    if (!isContentReady) {
      setIsCalculating(true);
      return;
    }

    const updateLayout = () => {
      const result = calculateLayout();
      if (result) {
        setLayoutState(result);
        setIsCalculating(false);
      }
    };

    const debouncedUpdate = debounce(updateLayout, 100);

    // Initial calculation with small delay to ensure DOM is ready
    const initialTimer = requestAnimationFrame(() => {
      updateLayout();
    });

    // Observe content size changes
    const resizeObserver = new ResizeObserver(debouncedUpdate);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }

    // Listen for viewport changes (orientation, resize)
    window.addEventListener('resize', debouncedUpdate);

    // Visual Viewport API for mobile browser UI changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedUpdate);
    }

    return () => {
      cancelAnimationFrame(initialTimer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedUpdate);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedUpdate);
      }
    };
  }, [isContentReady, calculateLayout]);

  return {
    headerRef,
    contentRef,
    footerRef,
    layoutMode: layoutState.mode,
    headerPadding: layoutState.headerPadding,
    footerPadding: layoutState.footerPadding,
    contentPadding: layoutState.contentPadding,
    isCalculating,
  };
}
