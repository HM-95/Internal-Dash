'use client';

import React from 'react';

interface MobileVideoBackgroundProps {
  className?: string;
}

// Simplified mobile video background component for build compatibility
export const MobileVideoBackground = ({ className = "" }: MobileVideoBackgroundProps) => {
  const [isClient, setIsClient] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient || !containerRef.current) return;

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.src = '/BuzzBerry Social Media video.mp4';
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    `;
    
    // Set attributes for better mobile compatibility
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('muted', 'true');
    
    containerRef.current.appendChild(video);
    
    // Try to play the video
    video.play().catch(err => {
      console.log('Video autoplay failed:', err);
    });

    return () => {
      if (containerRef.current && video.parentNode === containerRef.current) {
        containerRef.current.removeChild(video);
      }
    };
  }, [isClient]);

  // Return a proper React element
  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    />
  );
};

// Cleanup function for mobile video (simplified)
export const cleanupMobileVideo = () => {
  // No cleanup needed for simplified version
}; 