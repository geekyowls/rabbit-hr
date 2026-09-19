import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from 'react';

type NavigationMode = 'linear' | 'grid';

interface UseArrowNavigationOptions {
  itemCount: number;
  mode?: NavigationMode;
  columns?: number;
  initialIndex?: number;
  loop?: boolean;
  enabled?: boolean;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
}

interface UseArrowNavigationReturn {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  scrollToIndex: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  getItemProps: (index: number) => {
    'data-item-index': number;
    'aria-selected': boolean;
    tabIndex: number;
    onClick: () => void;
  };
}

export function useArrowNavigation({
  itemCount,
  mode = 'linear',
  columns = 1,
  initialIndex = -1,
  loop = true,
  enabled = true,
  onSelect,
  onEscape,
}: UseArrowNavigationOptions): UseArrowNavigationReturn {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemCount === 0) {
      setActiveIndex(-1);
    } else if (activeIndex >= itemCount) {
      setActiveIndex(itemCount - 1);
    }
  }, [itemCount, activeIndex]);

  const scrollToIndex = useCallback((index: number) => {
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const element = containerRef.current.querySelector<HTMLElement>(
        `[data-item-index="${index}"]`,
      );
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }, []);

  const navigateLinear = useCallback(
    (direction: 'up' | 'down') => {
      if (itemCount === 0) return;

      setActiveIndex((prev) => {
        let next: number;

        if (prev < 0) {
          next = direction === 'down' ? 0 : itemCount - 1;
        } else if (direction === 'down') {
          next = prev + 1;
          if (next >= itemCount) {
            next = loop ? 0 : itemCount - 1;
          }
        } else {
          next = prev - 1;
          if (next < 0) {
            next = loop ? itemCount - 1 : 0;
          }
        }

        scrollToIndex(next);
        return next;
      });
    },
    [itemCount, loop, scrollToIndex],
  );

  const navigateGrid = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (itemCount === 0) return;

      setActiveIndex((prev) => {
        if (prev < 0) {
          const next = 0;
          scrollToIndex(next);
          return next;
        }

        const rows = Math.ceil(itemCount / columns);
        const currentRow = Math.floor(prev / columns);
        const currentCol = prev % columns;

        let nextRow = currentRow;
        let nextCol = currentCol;

        switch (direction) {
          case 'up':
            nextRow = currentRow - 1;
            if (nextRow < 0) {
              nextRow = loop ? rows - 1 : 0;
            }
            break;
          case 'down':
            nextRow = currentRow + 1;
            if (nextRow >= rows) {
              nextRow = loop ? 0 : rows - 1;
            }
            break;
          case 'left':
            nextCol = currentCol - 1;
            if (nextCol < 0) {
              nextCol = loop ? columns - 1 : 0;
              if (loop) nextRow = nextRow - 1 < 0 ? rows - 1 : nextRow - 1;
            }
            break;
          case 'right':
            nextCol = currentCol + 1;
            if (nextCol >= columns) {
              nextCol = loop ? 0 : columns - 1;
              if (loop) nextRow = nextRow + 1 >= rows ? 0 : nextRow + 1;
            }
            break;
        }

        let next = nextRow * columns + nextCol;
        if (next >= itemCount) {
          next = itemCount - 1;
        }
        if (next < 0) {
          next = 0;
        }

        scrollToIndex(next);
        return next;
      });
    },
    [itemCount, columns, loop, scrollToIndex],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (mode === 'linear') {
            navigateLinear('down');
          } else {
            navigateGrid('down');
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (mode === 'linear') {
            navigateLinear('up');
          } else {
            navigateGrid('up');
          }
          break;

        case 'ArrowLeft':
          if (mode === 'grid') {
            event.preventDefault();
            navigateGrid('left');
          }
          break;

        case 'ArrowRight':
          if (mode === 'grid') {
            event.preventDefault();
            navigateGrid('right');
          }
          break;

        case 'Enter':
        case ' ':
          if (activeIndex >= 0 && onSelect) {
            event.preventDefault();
            onSelect(activeIndex);
          }
          break;

        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          scrollToIndex(0);
          break;

        case 'End':
          event.preventDefault();
          const lastIndex = itemCount - 1;
          setActiveIndex(lastIndex);
          scrollToIndex(lastIndex);
          break;

        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
      }
    },
    [
      enabled,
      mode,
      activeIndex,
      itemCount,
      navigateLinear,
      navigateGrid,
      onSelect,
      onEscape,
      scrollToIndex,
    ],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      'data-item-index': index,
      'aria-selected': index === activeIndex,
      tabIndex: index === activeIndex ? 0 : -1,
      onClick: () => {
        setActiveIndex(index);
        onSelect?.(index);
      },
    }),
    [activeIndex, onSelect],
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    scrollToIndex,
    containerRef,
    getItemProps,
  };
}

export type {
  NavigationMode,
  UseArrowNavigationOptions,
  UseArrowNavigationReturn,
};
