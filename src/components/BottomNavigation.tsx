import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Settings } from 'lucide-react';

export const BottomNavigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/?add=true', icon: Plus, label: 'Hinzufügen' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path.split('?')[0]);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
