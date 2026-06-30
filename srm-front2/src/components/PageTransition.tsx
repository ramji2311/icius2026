// import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  // Temporarily remove framer-motion animations
  return <>{children}</>;
};

export default PageTransition;
