import { useEffect, useState } from 'react';
import {
  getAndroidDownloadAction,
  getFallbackAndroidDownloadAction,
  type AndroidDownloadAction,
} from '../api/app-distribution';

export function useAndroidDownloadAction() {
  const [downloadAction, setDownloadAction] = useState<AndroidDownloadAction>(
    getFallbackAndroidDownloadAction,
  );

  useEffect(() => {
    let isMounted = true;

    getAndroidDownloadAction().then((nextAction) => {
      if (isMounted) {
        setDownloadAction(nextAction);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return downloadAction;
}
