import { useState, useRef, useEffect } from 'react';

export function PullToRefresh({ onRefresh, children }) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);

  const pullDistance = currentY - startY;
  const maxPull = 80;
  const showSpinner = pullDistance > 10;

  useEffect(() => {
    if (refreshing) {
      onRefresh().finally(() => {
        setRefreshing(false);
        setCurrentY(startY);
      });
    }
  }, [refreshing, onRefresh, startY]);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setCurrentY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY > 0 && window.scrollY === 0) {
      const y = e.touches[0].clientY;
      if (y > startY) {
        // Prevent scrolling while pulling down
        if (e.cancelable) e.preventDefault();
        setCurrentY(y > startY + maxPull ? startY + maxPull : y);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > maxPull * 0.8) {
      setRefreshing(true);
    } else {
      setCurrentY(startY);
    }
    if (!refreshing) setStartY(0);
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full transition-transform duration-200"
      style={{ transform: `translateY(${!refreshing ? Math.max(0, pullDistance) : maxPull * 0.5}px)` }}
    >
      {showSpinner && (
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 flex justify-center items-center h-12 w-full">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        </div>
      )}
      {children}
    </div>
  );
}
