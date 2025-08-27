import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  wordsPerMinute?: number; // words per minute instead of characters per second
  className?: string;
  onComplete?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  wordsPerMinute = 82, 
  className = "",
  onComplete 
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (text.length === 0) return;
    
    setDisplayText("");
    setIsComplete(false);
    
    // Convert words per minute to characters per second
    // Average word length is ~5 characters
    const charactersPerSecond = (wordsPerMinute * 5) / 60;
    const intervalTime = 1000 / charactersPerSecond; // milliseconds per character
    
    let currentIndex = 0;
    
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
  }, [text, wordsPerMinute, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <span 
        className={`inline-block w-0.5 h-[1em] ml-1 bg-primary ${
          isComplete 
            ? 'animate-pulse' 
            : ''
        }`}
        style={{
          animation: isComplete 
            ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            : 'typing-blink 1.2s infinite'
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes typing-blink {
            0%, 50% {
              opacity: 1;
            }
            51%, 100% {
              opacity: 0;
            }
          }
        `
      }} />
    </span>
  );
};

export default TypewriterText;