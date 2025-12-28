import React, { forwardRef } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle = forwardRef<HTMLButtonElement, LanguageToggleProps>(
  function LanguageToggle({ className }, ref) {
    const { language, setLanguage } = useLanguage();

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            ref={ref}
            variant="ghost" 
            size="icon" 
            className={cn("h-9 w-9", className)} 
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setLanguage('en')}
            className={cn(language === 'en' && 'bg-accent')}
          >
            <span className="mr-2">🇬🇧</span>
            English
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setLanguage('hi')}
            className={cn(language === 'hi' && 'bg-accent')}
          >
            <span className="mr-2">🇮🇳</span>
            हिंदी
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
