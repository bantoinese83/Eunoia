import React from 'react';

interface PlayPauseButtonProps {
  playbackState: 'stopped' | 'playing' | 'loading' | 'paused';
  onClick: () => void;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({ playbackState, onClick }) => {
  const renderPause = () => (
    <path
      d="M75.0037 69V39H83.7537V69H75.0037ZM56.2537 69V39H65.0037V69H56.2537Z"
      fill="#FEFEFE"
    />
  );

  const renderPlay = () => (
    <path d="M60 71.5V36.5L87.5 54L60 71.5Z" fill="#FEFEFE" />
  );

  const renderLoading = () => (
    <path shapeRendering="crispEdges" className="loader" d="M70,74.2L70,74.2c-10.7,0-19.5-8.7-19.5-19.5l0,0c0-10.7,8.7-19.5,19.5-19.5
            l0,0c10.7,0,19.5,8.7,19.5,19.5l0,0"/>
  );

  const renderIcon = () => {
    if (playbackState === 'playing') {
      return renderPause();
    } else if (playbackState === 'loading') {
      return renderLoading();
    } else {
      return renderPlay();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <svg width="140" height="140" viewBox="0 -10 140 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="6" width="96" height="96" rx="48" fill="black" fillOpacity="0.05" />
        <rect x="23.5" y="7.5" width="93" height="93" rx="46.5" stroke="black" strokeOpacity="0.3" strokeWidth="3" />
        <g filter="url(#filter0_ddi_1048_7373)">
          <rect x="25" y="9" width="90" height="90" rx="45" fill="white" fillOpacity="0.05" shapeRendering="crispEdges" />
        </g>
        {renderIcon()}
        <defs>
          <filter id="filter0_ddi_1048_7373" x="0" y="0" width="140" height="140" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="2" />
            <feGaussianBlur stdDeviation="4" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1048_7373" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="16" />
            <feGaussianBlur stdDeviation="12.5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="effect1_dropShadow_1048_7373" result="effect2_dropShadow_1048_7373" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_1048_7373" result="shape" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="3" />
            <feGaussianBlur stdDeviation="1.5" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
            <feBlend mode="normal" in2="shape" result="effect3_innerShadow_1048_7373" />
          </filter>
        </defs>
      </svg>
      <div className="hitbox" style={{ pointerEvents: 'all', position: 'absolute', width: '65%', aspectRatio: '1', top: '9%', borderRadius: '50%', cursor: 'pointer' }} onClick={onClick}></div>
    </div>
  );
};
