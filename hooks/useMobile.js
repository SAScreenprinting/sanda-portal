'use client';
import { useState, useEffect } from 'react';

export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth <= breakpoint;
    return false;
  });

  useEffect(() => {
    function handle() { setIsMobile(window.innerWidth <= breakpoint); }
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [breakpoint]);

  return isMobile;
}
