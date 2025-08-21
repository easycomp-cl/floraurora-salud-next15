import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useRouteChange(callback: () => void) {
  const pathname = usePathname();

  useEffect(() => {
    callback();
  }, [pathname, callback]);
}
