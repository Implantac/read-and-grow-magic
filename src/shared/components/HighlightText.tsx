import React from 'react';

interface HighlightTextProps {
  text: string;
  search: string;
  className?: string;
}

export const HighlightText = ({ text, search, className = "bg-yellow-100 text-yellow-900 rounded-sm px-0.5 font-bold" }: HighlightTextProps) => {
  if (!search) return <>{text}</>;
  
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedSearch})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className={className}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};
