import React, { useState, useRef, useEffect } from 'react';

interface WeightSliderProps {
  value: number;
  color: string;
  onChange: (value: number) => void;
}

export const WeightSlider: React.FC<WeightSliderProps> = ({ value, color, onChange }) => {
  const [sliderValue, setSliderValue] = useState(value);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerBoundsRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    containerBoundsRef.current = scrollContainerRef.current?.getBoundingClientRect() || null;
    document.body.classList.add('dragging');
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    updateValueFromPosition(e.clientY);
  };

  const handlePointerMove = (e: PointerEvent) => {
    updateValueFromPosition(e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    updateValueFromPosition(e.touches[0].clientY);
  };

  const handlePointerUp = (_e: PointerEvent) => {
    window.removeEventListener('pointermove', handlePointerMove);
    document.body.classList.remove('dragging');
    containerBoundsRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY;
    const newValue = sliderValue + delta * -0.005;
    setSliderValue(Math.max(0, Math.min(2, newValue)));
    onChange(newValue);
  };

  const updateValueFromPosition = (clientY: number) => {
    if (!containerBoundsRef.current) return;

    const trackHeight = containerBoundsRef.current.height;
    const relativeY = clientY - containerBoundsRef.current.top;
    const normalizedValue = 1 - Math.max(0, Math.min(trackHeight, relativeY)) / trackHeight;
    const newValue = normalizedValue * 2;

    setSliderValue(newValue);
    onChange(newValue);
  };

  const thumbHeightPercent = (sliderValue / 2) * 100;
  const displayValue = sliderValue.toFixed(2);

  return (
    <div
      className="scroll-container"
      ref={scrollContainerRef}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      style={{ cursor: 'ns-resize', position: 'relative', height: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', padding: '5px' }}
    >
      <div className="slider-container" style={{ position: 'relative', width: '10px', height: '100%', backgroundColor: '#0009', borderRadius: '4px' }}>
        <div id="thumb" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', borderRadius: '4px', boxShadow: '0 0 3px rgba(0, 0, 0, 0.7)', height: `${thumbHeightPercent}%`, backgroundColor: color, display: sliderValue > 0.01 ? 'block' : 'none' }}></div>
      </div>
      <div className="value-display" style={{ fontSize: '1.3vmin', color: '#ccc', margin: '0.5vmin 0', userSelect: 'none', textAlign: 'center' }}>{displayValue}</div>
    </div>
  );
};
