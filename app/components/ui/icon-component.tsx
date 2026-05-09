import React from "react";

interface IconProps {
  name: string;
  className?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5", 
  lg: "w-6 h-6",
  xl: "w-8 h-8"
};

export const Icon: React.FC<IconProps> = ({ 
  name, 
  className = "", 
  alt = "", 
  size 
}) => {
  const sizeClass = size ? sizeClasses[size] : "";
  const finalClassName = `${sizeClass} ${className}`.trim();
  
  return (
    <img
      src={`/icons/${name}`}
      alt={alt}
      className={finalClassName}
      onError={(e) => {
        
        // Optionally hide the image or show a placeholder
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};