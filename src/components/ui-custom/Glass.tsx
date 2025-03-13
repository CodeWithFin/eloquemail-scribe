
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: 'light' | 'medium' | 'heavy';
  border?: boolean;
}

const Glass = ({
  children,
  className,
  dark = false,
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
    light: dark ? 'bg-opacity-40' : 'bg-opacity-40',
    medium: dark ? 'bg-opacity-60' : 'bg-opacity-60',
    heavy: dark ? 'bg-opacity-80' : 'bg-opacity-80',
  };

  return (
    <div
      className={cn(
        dark ? 'bg-gray-900' : 'bg-white',
        bgOpacityMap[opacity],
        blurMap[blur],
        border && (dark ? 'border border-gray-800 border-opacity-50' : 'border border-white border-opacity-20'),
        'shadow-glass rounded-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Glass;
