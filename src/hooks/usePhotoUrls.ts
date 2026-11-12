import { useEffect, useState } from 'react';
import { photoUrls } from '@/lib/media';

/** Links the browser can show for a post's stored photos. Paths still loading are simply missing from the map. */
export function usePhotoUrls(paths: string[]): { urls: Record<string, string>; failed: boolean } {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const key = paths.join('|');

  useEffect(() => {
    if (!key) return;
    let active = true;
    photoUrls(key.split('|'))
      .then((next) => {
        if (!active) return;
        setUrls((prev) => ({ ...prev, ...next }));
        setFailed(false);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [key]);

  return { urls, failed };
}
