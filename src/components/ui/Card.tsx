import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-surface
        border
        border-border
        rounded-xl
        shadow-elevation-1
        p-4
        transition-all
        duration-200
        ${hover ? 'hover:shadow-elevation-2 hover:border-border-strong' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}