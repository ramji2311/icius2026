import React from 'react';

export const FadeUp = ({ 
  children, 
  delay = 0 
}: { 
  children: React.ReactNode;
  delay?: number;
}) => {
  return (
    <div
      data-aos="fade-up"
      data-aos-delay={delay * 1000}
      data-aos-duration="1000"
      data-aos-once="true"
    >
      {children}
    </div>
  );
};
