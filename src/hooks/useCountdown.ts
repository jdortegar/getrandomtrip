import { useEffect, useState } from 'react';

/**
 * Custom hook for countdown timer functionality
 * Calculates time remaining until a target date and updates every minute
 */
export function useCountdown(
  targetDate: Date | string | null | undefined,
): string {
  const [timeLeft, setTimeLeft] = useState<string>('—');

  useEffect(() => {
    const tick = () => {
      if (!targetDate) return setTimeLeft('—');

      const now = new Date();
      const start = new Date(targetDate);
      const ms = +start - +now;

      if (ms <= 0) return setTimeLeft('¡Es hoy!');

      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);

      setTimeLeft(`${d}d ${h}h ${m}m`);
    };

    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}
