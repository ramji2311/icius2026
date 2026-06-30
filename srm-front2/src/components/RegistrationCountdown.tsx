import { useState, useEffect, memo } from 'react';

const RegistrationCountdown = () => {
  const [timeRemaining, setTimeRemaining] = useState<{ days: number, hours: number, minutes: number, seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Conference date - November 26, 2026
  const conferenceDate = new Date('2026-11-26T09:00:00');

  // Update countdown timer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = conferenceDate.getTime() - now.getTime();

      if (difference <= 0) {
        // Conference has started or passed
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    // Initial calculation
    calculateTimeRemaining();

    // Set up interval for countdown
    const intervalId = setInterval(calculateTimeRemaining, 1000);


    return () => clearInterval(intervalId);
  }, []); // Run once on mount

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
      {/* Gradient Background */}
      <div className="bg-gray-900 px-4 py-8 sm:px-8 sm:py-12">
        {/* Title */}
        <h2 className="text-white text-2xl md:text-3xl font-bold text-center mb-8">
          Time Until Conference
        </h2>

        {/* Countdown Boxes */}
        <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-6">
          {/* Days */}
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 min-w-[64px] sm:min-w-[80px] md:min-w-[100px] shadow-lg">
              <div className="text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center">
                {String(timeRemaining.days).padStart(2, '0')}
              </div>
            </div>
            <div className="text-white text-[10px] sm:text-xs md:text-sm font-medium mt-2 uppercase tracking-wider">
              Days
            </div>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 min-w-[64px] sm:min-w-[80px] md:min-w-[100px] shadow-lg">
              <div className="text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center">
                {String(timeRemaining.hours).padStart(2, '0')}
              </div>
            </div>
            <div className="text-white text-[10px] sm:text-xs md:text-sm font-medium mt-2 uppercase tracking-wider">
              Hours
            </div>
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 min-w-[64px] sm:min-w-[80px] md:min-w-[100px] shadow-lg">
              <div className="text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </div>
            </div>
            <div className="text-white text-[10px] sm:text-xs md:text-sm font-medium mt-2 uppercase tracking-wider">
              Minutes
            </div>
          </div>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 min-w-[64px] sm:min-w-[80px] md:min-w-[100px] shadow-lg">
              <div className="text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </div>
            </div>
            <div className="text-white text-[10px] sm:text-xs md:text-sm font-medium mt-2 uppercase tracking-wider">
              Seconds
            </div>
          </div>
        </div>

        {/* Conference Date Info */}
        <div className="mt-8 text-center">
          <p className="text-white/90 text-sm md:text-base">
            ICIUS 2026 Conference
          </p>
          <p className="text-white/80 text-xs md:text-sm mt-1">
            26–27 November 2026 | Coimbatore, Tamil Nadu, India
          </p>
        </div>
      </div>
    </div>
  );
};
// Export as memoized component to prevent unnecessary re-renders
export default memo(RegistrationCountdown);