'use client';

import React, { useRef, useEffect, useState } from 'react';

interface VideoBackgroundProps {
  className?: string;
}

// Global video element that persists across all pages
let globalVideo: HTMLVideoElement | null = null;
let videoInitialized = false;
let videoReady = false;

// Create the global video element once
const createGlobalVideo = () => {
  if (globalVideo) return globalVideo;

  console.log('🎬 Creating global persistent video element');
  
  globalVideo = document.createElement('video');
  globalVideo.src = "/BuzzBerry Social Media video.mp4";
  globalVideo.muted = true;
  globalVideo.playsInline = true;
  globalVideo.autoplay = true;
  globalVideo.loop = true;
  globalVideo.controls = false;
  globalVideo.preload = 'auto';
  
  // Mobile attributes
  globalVideo.setAttribute('webkit-playsinline', 'true');
  globalVideo.setAttribute('playsinline', 'true');
  globalVideo.setAttribute('muted', 'true');
  
  // Styling
  globalVideo.style.cssText = `
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    z-index: 2 !important;
    display: block !important;
  `;

  // Event handlers
  globalVideo.addEventListener('loadeddata', () => {
    console.log('✅ Global video loaded data');
    videoReady = true;
    
    if (!videoInitialized) {
      globalVideo?.play().then(() => {
        console.log('✅ Global video started playing');
        videoInitialized = true;
      }).catch(error => {
        console.log('⚠️ Autoplay prevented, waiting for user interaction:', error);
        
        const playOnInteraction = () => {
          globalVideo?.play().then(() => {
            console.log('✅ Global video playing after interaction');
            videoInitialized = true;
          }).catch(e => console.log('❌ Play failed:', e));
          
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };
        
        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });
      });
    }
  });

  globalVideo.addEventListener('error', (e) => {
    console.error('❌ Global video error:', e);
    if (globalVideo?.error) {
      console.error('Error details:', globalVideo.error);
    }
  });

  globalVideo.addEventListener('canplay', () => {
    console.log('▶️ Global video can play');
    if (globalVideo?.paused && videoReady) {
      globalVideo.play().catch(e => console.log('Play on canplay failed:', e));
    }
  });

  // Keep video playing
  globalVideo.addEventListener('pause', () => {
    console.log('⏸️ Global video paused, attempting to resume');
    setTimeout(() => {
      if (globalVideo && globalVideo.paused && !globalVideo.ended) {
        globalVideo.play().catch(e => console.log('Resume failed:', e));
      }
    }, 100);
  });

  // Handle visibility changes
  const handleVisibilityChange = () => {
    if (!document.hidden && globalVideo?.paused) {
      console.log('👁️ Page visible, resuming video');
      globalVideo.play().catch(e => console.log('Resume on visibility failed:', e));
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Start loading
  globalVideo.load();
  
  return globalVideo;
};

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.log('📱 VideoBackground component mounted');

    // Get or create the global video
    const video = createGlobalVideo();
    
    // Clear container and add video
    container.innerHTML = '';
    container.appendChild(video);

    // Check if video is already ready
    if (videoReady) {
      setIsVideoVisible(true);
      if (video.paused && videoInitialized) {
        video.play().catch(e => console.log('Resume play failed:', e));
      }
    }

    // Listen for video ready state
    const checkVideoReady = () => {
      if (videoReady) {
        setIsVideoVisible(true);
      }
    };

    const interval = setInterval(checkVideoReady, 100);

    // Cleanup - DON'T remove the video, just detach it
    return () => {
      clearInterval(interval);
      console.log('📱 VideoBackground component unmounting');
      // Video will be moved to next component that mounts
    };
  }, []);

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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          zIndex: 10,
          fontFamily: 'monospace'
        }}>
          <div>Global Video: {videoReady ? 'READY' : 'LOADING'}</div>
          <div>Initialized: {videoInitialized ? 'YES' : 'NO'}</div>
          <div>Visible: {isVideoVisible ? 'YES' : 'NO'}</div>
          <div>File: /BuzzBerry Social Media video.mp4</div>
        </div>
      )}
    </div>
  );
};

// Cleanup function for when the app unmounts completely
export const cleanupGlobalVideo = () => {
  if (globalVideo) {
    console.log('🧹 Cleaning up global video');
    globalVideo.pause();
    globalVideo.removeAttribute('src');
    globalVideo.load();
    globalVideo = null;
    videoInitialized = false;
    videoReady = false;
  }
}; 