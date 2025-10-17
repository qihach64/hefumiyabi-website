"use client";

import { Navigation } from "lucide-react";

interface NavigationButtonProps {
  latitude: number;
  longitude: number;
}

export default function NavigationButton({ latitude, longitude }: NavigationButtonProps) {
  const handleNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <button
      onClick={handleNavigation}
      className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
    >
      <Navigation className="w-4 h-4" />
      导航
    </button>
  );
}
