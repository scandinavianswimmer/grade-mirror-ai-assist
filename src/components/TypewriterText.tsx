import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // characters per second
  className?: string;
  onComplete?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 80, 
  className = "",
  onComplete 
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (text.length === 0) return;
    
    setDisplayText("");
    setIsComplete(false);
    
    let currentIndex = 0;
    const intervalTime = 1000 / speed; // milliseconds per character
    
    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        onComplete?.();
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <span 
        className={`inline-block w-0.5 h-[1em] bg-primary ml-1 ${
          isComplete ? 'animate-pulse' : 'animate-pulse opacity-100'
        }`}
        style={{
          animation: 'pulse 1s infinite'
        }}
      />
    </span>
  );
};

export default TypewriterText;