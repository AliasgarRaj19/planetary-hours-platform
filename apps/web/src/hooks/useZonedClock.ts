import { useEffect, useMemo, useState } from 'react';

export function useZonedClock(timezone?: string) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  return useMemo(() => {
    if (!timezone) {
      return {
        currentDate: '',
        currentTime: '',
        now,
      };
    }

    return {
      currentDate: new Intl.DateTimeFormat('en', {
        dateStyle: 'full',
        timeZone: timezone,
      }).format(now),
      currentTime: new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone,
        timeZoneName: 'short',
      }).format(now),
      now,
    };
  }, [now, timezone]);
}
