'use client';

import { Share, Download, Upload } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';

export function HeaderControls() {
  const handleImport = () => {
    // Import logic
  };

  const handleExport = () => {
    // Export logic
  };

  const handleShare = () => {
    // Share logic
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9"
        onClick={handleImport}
        title="Import data"
      >
        <Upload className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9"
        onClick={handleExport}
        title="Export data"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9"
        onClick={handleShare}
        title="Share"
      >
        <Share className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1.5" />
      <ThemeToggle />
    </div>
  );
}