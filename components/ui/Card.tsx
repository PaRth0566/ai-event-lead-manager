import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200/90 shadow-2xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 sm:p-5 border-b border-slate-100 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-3.5 sm:p-4 bg-slate-50/50 rounded-b-lg border-t border-slate-100 ${className}`}>{children}</div>;
}
