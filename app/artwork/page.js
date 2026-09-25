'use client';
import { useEffect } from 'react';

// Artwork and designs used to be two lists of the same thing; everything lives under Designs now.
export default function ArtworkRedirect() {
  useEffect(() => { window.location.replace('/designs'); }, []);
  return null;
}
