// Utility functions for formatting dynamic data

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
};

export const formatPercentage = (num: number): string => {
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export const formatEngagement = (num: number): string => {
  return `+${num.toFixed(2)}%`;
};

export const getSocialMediaIcon = (platform: string): string => {
  const iconMap: { [key: string]: string } = {
    instagram: 'InstagramLogo.svg',
    tiktok: 'TikTokLogo.svg',
    youtube: 'YouTubeLogo.svg',
    x: 'XLogo.svg'
  };
  return iconMap[platform.toLowerCase()] || 'InstagramLogo.svg';
};

export const getMatchScoreColor = (score: number): string => {
  // Return empty string since we're using inline styles only
  return '';
};

export const getMatchScoreStyle = (score: number): React.CSSProperties => {
  // Enhanced inline styles to match the original Vite version
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 6px',
    borderRadius: '6px',
    marginLeft: '1px',
    fontWeight: '600',
    fontSize: '11px',
    lineHeight: '14px',
    color: 'white',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  };

  if (score >= 80) {
    return { 
      ...baseStyle, 
      backgroundColor: '#16a34a', // darker green for better contrast
      borderColor: 'rgba(255, 255, 255, 0.2)',
    };
  }
  if (score >= 50) {
    return { 
      ...baseStyle, 
      backgroundColor: '#ca8a04', // darker yellow for better contrast
      borderColor: 'rgba(255, 255, 255, 0.2)',
    };
  }
  if (score >= 30) {
    return { 
      ...baseStyle, 
      backgroundColor: '#ea580c', // darker orange for better contrast
      borderColor: 'rgba(255, 255, 255, 0.2)',
    };
  }
  return { 
    ...baseStyle, 
    backgroundColor: '#dc2626', // darker red for better contrast
    borderColor: 'rgba(255, 255, 255, 0.2)',
  };
};

export const getBuzzScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600 bg-green-100';
  if (score >= 80) return 'text-blue-600 bg-blue-100';
  if (score >= 70) return 'text-yellow-600 bg-yellow-100';
  if (score >= 60) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};
export const getTrendIcon = (changeType: 'positive' | 'negative'): string => {
  return changeType === 'positive' ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg';
};

export const getTrendColor = (changeType: 'positive' | 'negative'): string => {
  return changeType === 'positive' ? 'text-[#1ad598]' : 'text-[#ea3a3d]';
}; 