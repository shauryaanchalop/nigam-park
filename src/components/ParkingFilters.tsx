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
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="evCharging"
          checked={filters.evCharging}
          onCheckedChange={() => handleChange('evCharging')}
        />
        <Label htmlFor="evCharging" className="flex items-center gap-1 text-sm cursor-pointer">
          <Zap className="h-4 w-4 text-green-500" />
          {isHindi ? 'EV चार्जिंग' : 'EV Charging'}
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="coveredParking"
          checked={filters.coveredParking}
          onCheckedChange={() => handleChange('coveredParking')}
        />
        <Label htmlFor="coveredParking" className="flex items-center gap-1 text-sm cursor-pointer">
          <Umbrella className="h-4 w-4 text-blue-500" />
          {isHindi ? 'ढकी पार्किंग' : 'Covered'}
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="nearMetro"
          checked={filters.nearMetro}
          onCheckedChange={() => handleChange('nearMetro')}
        />
        <Label htmlFor="nearMetro" className="flex items-center gap-1 text-sm cursor-pointer">
          <Train className="h-4 w-4 text-primary" />
          {isHindi ? 'मेट्रो के पास' : 'Near Metro'}
        </Label>
      </div>

      {(filters.evCharging || filters.coveredParking || filters.nearMetro) && (
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-destructive/10" 
          onClick={() => onChange({ evCharging: false, coveredParking: false, nearMetro: false })}
        >
          {isHindi ? 'फ़िल्टर हटाएं' : 'Clear Filters'}
        </Badge>
      )}
    </div>
  );
}
