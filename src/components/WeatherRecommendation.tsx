import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Umbrella, ThermometerSun, Wind, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeatherData {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  temperature: number;
  humidity: number;
  windSpeed: number;
  recommendation: string;
  recommendationHi: string;
}

export function WeatherRecommendation() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  useEffect(() => {
    // Mock weather data - in production, use a weather API
    const conditions: WeatherData[] = [
      {
        condition: 'sunny',
        temperature: 32,
        humidity: 45,
        windSpeed: 12,
        recommendation: 'Prefer covered parking to protect your car from heat',
        recommendationHi: 'गर्मी से बचाव के लिए छायादार पार्किंग चुनें',
      },
      {
        condition: 'rainy',
        temperature: 26,
        humidity: 85,
        windSpeed: 20,
        recommendation: 'Book covered parking to keep your car dry',
        recommendationHi: 'बारिश से बचाव के लिए ढकी हुई पार्किंग बुक करें',
      },
      {
        condition: 'cloudy',
        temperature: 28,
        humidity: 65,
        windSpeed: 15,
        recommendation: 'Good weather for any parking. No special precautions needed',
        recommendationHi: 'अच्छा मौसम, किसी भी पार्किंग में जा सकते हैं',
      },
    ];

    // Randomly select weather (in production, fetch from API)
    const randomWeather = conditions[Math.floor(Math.random() * conditions.length)];
    setWeather(randomWeather);
  }, []);

  if (!weather) return null;

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'sunny':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'rainy':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'stormy':
        return <CloudRain className="h-8 w-8 text-purple-500" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-500" />;
    }
  };

  const getConditionLabel = () => {
    switch (weather.condition) {
      case 'sunny':
        return isHindi ? 'धूप' : 'Sunny';
      case 'rainy':
        return isHindi ? 'बारिश' : 'Rainy';
      case 'stormy':
        return isHindi ? 'तूफान' : 'Stormy';
      default:
        return isHindi ? 'बादल' : 'Cloudy';
    }
  };

  const shouldShowCoveredParking = weather.condition === 'rainy' || weather.condition === 'sunny';

  return (
    <Card className={`${
      weather.condition === 'rainy' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200' :
      weather.condition === 'sunny' ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200' :
      'bg-muted/50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getWeatherIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{isHindi ? 'मौसम सलाह' : 'Weather Advisory'}</span>
              <Badge variant="outline" className="text-xs">
                {getConditionLabel()}
              </Badge>
              {shouldShowCoveredParking && (
                <Badge variant="secondary" className="text-xs">
                  <Umbrella className="h-3 w-3 mr-1" />
                  {isHindi ? 'ढकी पार्किंग' : 'Covered'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isHindi ? weather.recommendationHi : weather.recommendation}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThermometerSun className="h-3 w-3" />
                {weather.temperature}°C
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {weather.windSpeed} km/h
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
