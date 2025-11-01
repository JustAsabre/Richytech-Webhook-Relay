import { cn } from '../../lib/utils';
import React, { type ReactNode } from 'react';

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
}

export const AuroraBackground = ({
  className,
  children,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <>
      <style>{`
        @keyframes aurora-1 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate(50%, 30%) scale(1.2);
            opacity: 0.7;
          }
        }
        @keyframes aurora-2 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translate(-30%, 40%) scale(1.3);
            opacity: 0.6;
          }
        }
        @keyframes aurora-3 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
            opacity: 0.45;
          }
          50% {
            transform: translate(20%, -20%) scale(1.15);
            opacity: 0.65;
          }
        }
        @keyframes aurora-4 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translate(-40%, -30%) scale(1.25);
            opacity: 0.55;
          }
        }
      `}</style>
      <div
        className={cn(
          "absolute inset-0 overflow-hidden bg-gray-950",
          className
        )}
        {...props}
      >
        {/* Aurora effect - 4 large animated orbs */}
        <div 
          className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(168, 85, 247, 0.4) 30%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'aurora-1 20s ease-in-out infinite',
          }}
        ></div>
        
        <div 
          className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.7) 0%, rgba(139, 92, 246, 0.3) 30%, transparent 70%)',
            filter: 'blur(70px)',
            animation: 'aurora-2 25s ease-in-out infinite',
            animationDelay: '5s',
          }}
        ></div>
        
        <div 
          className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, rgba(99, 102, 241, 0.3) 30%, transparent 70%)',
            filter: 'blur(75px)',
            animation: 'aurora-3 22s ease-in-out infinite',
            animationDelay: '10s',
          }}
        ></div>
        
        <div 
          className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.2) 30%, transparent 70%)',
            filter: 'blur(65px)',
            animation: 'aurora-4 18s ease-in-out infinite',
            animationDelay: '7s',
          }}
        ></div>
        
        {children}
      </div>
    </>
  );
};
