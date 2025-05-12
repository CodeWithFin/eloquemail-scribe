import React from 'react';
import { cn } from '@/lib/utils';

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: 'light' | 'medium' | 'heavy';
  border?: boolean;
}

const Glass = ({
  children,
  className,
  blur = 'md',
  opacity = 'medium',
  border = true,
  ...props
}: GlassProps) => {
  const blurMap = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const bgOpacityMap = {
    light: 'bg-opacity-40 dark:bg-opacity-40',
    medium: 'bg-opacity-60 dark:bg-opacity-60',
    heavy: 'bg-opacity-80 dark:bg-opacity-80',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900',
        bgOpacityMap[opacity],
        blurMap[blur],
        border && 'border border-white border-opacity-20 dark:border-gray-800 dark:border-opacity-50',
        'shadow-glass dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] rounded-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Glass;
