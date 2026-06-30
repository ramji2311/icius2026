import { useState, useEffect } from 'react';

const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const conferenceDate = new Date('2026-11-26').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = conferenceDate - now;

      if (difference > 0) {

        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24 mx-2">
      <div className="text-3xl font-bold text-white font-mono">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-white/80 text-sm mt-1">{label}</div>
    </div>
  );

  return (
    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-elevated">
      <h2 className="text-white text-2xl font-bold text-center mb-6">
        Time Until Conference
      </h2>
      <div className="flex flex-wrap justify-center gap-4 animate-bounce">
        <TimeBlock value={timeLeft.days} label="DAYS" />
        <TimeBlock value={timeLeft.hours} label="HOURS" />
        <TimeBlock value={timeLeft.minutes} label="MINUTES" />
        <TimeBlock value={timeLeft.seconds} label="SECONDS" />
      </div>
    </div>
  );
};

export default CountdownTimer;
