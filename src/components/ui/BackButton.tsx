import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackButton({ to = '/', label = 'Back to Dashboard', className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // If there's browser history, go back; otherwise navigate to the specified route
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(to);
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleClick}
      className={className}
    >
      <ChevronLeft className="w-4 h-4 mr-1" />
      {label}
    </Button>
  );
}
