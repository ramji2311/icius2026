import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

interface RouteChangeTrackerProps {
  children: React.ReactNode;
  loadingTime?: number;
}

const RouteChangeTracker: React.FC<RouteChangeTrackerProps> = ({
  children
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only show loading screen briefly on initial mount or extremely fast on route change
    // We'll set a tiny timeout to ensure everything is settled
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []); // Run only on mount

  return isLoading ? <LoadingScreen /> : <>{children}</>;
};

export default RouteChangeTracker;
