import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Contrast, Type, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  fontSize: number;
  reducedMotion: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  fontSize: 100,
  reducedMotion: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('accessibility-settings');
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));

    // Apply settings to document
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    root.style.fontSize = `${settings.fontSize}%`;

    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings]);

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleLargeText = () => {
    setSettings(prev => ({ ...prev, largeText: !prev.largeText }));
  };

  const increaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.min(prev.fontSize + 10, 150) }));
  };

  const decreaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.max(prev.fontSize - 10, 80) }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider 
      value={{ 
        settings, 
        toggleHighContrast, 
        toggleLargeText, 
        increaseFontSize, 
        decreaseFontSize, 
        resetSettings 
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

export function AccessibilityToggle() {
  const { 
    settings, 
    toggleHighContrast, 
    toggleLargeText, 
    increaseFontSize, 
    decreaseFontSize, 
    resetSettings 
  } = useAccessibility();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10"
          aria-label="Accessibility options"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={toggleHighContrast}>
          <Contrast className="mr-2 h-4 w-4" />
          High Contrast
          {settings.highContrast && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleLargeText}>
          <Type className="mr-2 h-4 w-4" />
          Large Text
          {settings.largeText && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={increaseFontSize}>
          <ZoomIn className="mr-2 h-4 w-4" />
          Increase Font Size ({settings.fontSize}%)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={decreaseFontSize}>
          <ZoomOut className="mr-2 h-4 w-4" />
          Decrease Font Size
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={resetSettings}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
