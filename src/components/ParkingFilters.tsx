import { Zap, Train, Umbrella } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParkingFiltersProps {
  filters: {
    evCharging: boolean;
    coveredParking: boolean;
    nearMetro: boolean;
  };
  onChange: (filters: { evCharging: boolean; coveredParking: boolean; nearMetro: boolean }) => void;
}

export function ParkingFilters({ filters, onChange }: ParkingFiltersProps) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  const handleChange = (key: keyof typeof filters) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        <Checkbox
          id="evCharging"
          checked={filters.evCharging}
          onCheckedChange={() => handleChange('evCharging')}
          className="h-4 w-4"
        />
        <Label htmlFor="evCharging" className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
          <span className="hidden xs:inline">{isHindi ? 'EV चार्जिंग' : 'EV Charging'}</span>
          <span className="xs:hidden">{isHindi ? 'EV' : 'EV'}</span>
        </Label>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-2">
        <Checkbox
          id="coveredParking"
          checked={filters.coveredParking}
          onCheckedChange={() => handleChange('coveredParking')}
          className="h-4 w-4"
        />
        <Label htmlFor="coveredParking" className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
          <Umbrella className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
          <span className="hidden xs:inline">{isHindi ? 'ढकी पार्किंग' : 'Covered'}</span>
          <span className="xs:hidden">{isHindi ? 'ढकी' : 'Covered'}</span>
        </Label>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-2">
        <Checkbox
          id="nearMetro"
          checked={filters.nearMetro}
          onCheckedChange={() => handleChange('nearMetro')}
          className="h-4 w-4"
        />
        <Label htmlFor="nearMetro" className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
          <Train className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          <span className="hidden xs:inline">{isHindi ? 'मेट्रो के पास' : 'Near Metro'}</span>
          <span className="xs:hidden">{isHindi ? 'मेट्रो' : 'Metro'}</span>
        </Label>
      </div>

      {(filters.evCharging || filters.coveredParking || filters.nearMetro) && (
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-destructive/10 text-xs h-6" 
          onClick={() => onChange({ evCharging: false, coveredParking: false, nearMetro: false })}
        >
          {isHindi ? 'हटाएं' : 'Clear'}
        </Badge>
      )}
    </div>
  );
}
