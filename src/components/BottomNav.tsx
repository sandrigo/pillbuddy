import { Home, PlusCircle, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onAddClick?: () => void;
}

export const BottomNav = ({ onAddClick }: BottomNavProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: Home, label: 'Home', path: '/', onClick: undefined },
    { icon: PlusCircle, label: 'Hinzufügen', path: '/', onClick: onAddClick },
    { icon: Settings, label: 'Settings', path: '/settings', onClick: undefined },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          
          const content = (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5]")} />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex-1 flex items-center justify-center"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex-1 flex items-center justify-center"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};