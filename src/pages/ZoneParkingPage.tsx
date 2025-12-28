import { useParams, Link } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Car, IndianRupee, ArrowRight, Navigation } from 'lucide-react';
import { useParkingLots } from '@/hooks/useParkingLots';

// Zone configuration with SEO-friendly slugs and metadata
const ZONE_CONFIG: Record<string, { 
  name: string; 
  zone: string; 
  description: string;
  landmarks: string[];
  metaDescription: string;
}> = {
  'connaught-place': {
    name: 'Connaught Place',
    zone: 'New Delhi',
    description: 'Find convenient parking near Connaught Place, the heart of New Delhi. Multiple MCD-managed parking lots available near CP inner and outer circles.',
    landmarks: ['Palika Bazaar', 'Janpath Market', 'Central Park', 'Regal Cinema'],
    metaDescription: 'Book parking near Connaught Place, Delhi. Real-time availability, online reservation & UPI payment. MCD-managed lots near CP inner circle, Palika Bazaar & Janpath.',
  },
  'karol-bagh': {
    name: 'Karol Bagh',
    zone: 'Central Delhi',
    description: 'Secure parking options in Karol Bagh, one of Delhi\'s busiest commercial areas. Book your spot near Ajmal Khan Road and Gaffar Market.',
    landmarks: ['Ajmal Khan Road', 'Gaffar Market', 'Karol Bagh Metro', 'Hanuman Mandir'],
    metaDescription: 'Find parking in Karol Bagh, Delhi. Real-time slot availability near Ajmal Khan Road & Gaffar Market. Reserve online with NIGAM-Park MCD smart parking.',
  },
  'chandni-chowk': {
    name: 'Chandni Chowk',
    zone: 'Old Delhi',
    description: 'Hassle-free parking near Chandni Chowk and Red Fort area. Navigate the historic lanes with pre-booked parking at MCD-managed facilities.',
    landmarks: ['Red Fort', 'Jama Masjid', 'Paranthe Wali Gali', 'Khari Baoli'],
    metaDescription: 'Parking near Chandni Chowk & Red Fort, Delhi. Pre-book your spot online. MCD smart parking with real-time availability & digital payments.',
  },
  'lajpat-nagar': {
    name: 'Lajpat Nagar',
    zone: 'South Delhi',
    description: 'Convenient parking in Lajpat Nagar, South Delhi\'s popular shopping destination. Multiple parking options near Central Market and Defence Colony.',
    landmarks: ['Central Market', 'Defence Colony', 'Moolchand Hospital', 'Lajpat Nagar Metro'],
    metaDescription: 'Book parking in Lajpat Nagar, South Delhi. Find spots near Central Market. Real-time availability & online reservation at MCD parking lots.',
  },
  'nehru-place': {
    name: 'Nehru Place',
    zone: 'South-East Delhi',
    description: 'Parking solutions for Nehru Place IT Hub, Delhi\'s largest IT market. Secure your spot near the commercial complex with easy online booking.',
    landmarks: ['Nehru Place IT Market', 'Epicuria Food Mall', 'Nehru Place Metro', 'Lotus Temple'],
    metaDescription: 'Nehru Place parking made easy. Book parking near IT Hub & Lotus Temple. MCD smart parking with live availability & UPI payments.',
  },
  'sarojini-nagar': {
    name: 'Sarojini Nagar',
    zone: 'South-West Delhi',
    description: 'Find parking near Sarojini Nagar Market, Delhi\'s famous street shopping destination. Book in advance to avoid weekend rush.',
    landmarks: ['Sarojini Market', 'Safdarjung Tomb', 'INA Market', 'Sarojini Nagar Metro'],
    metaDescription: 'Sarojini Nagar Market parking availability. Pre-book your spot online. MCD managed parking with real-time updates & digital payment options.',
  },
};

export default function ZoneParkingPage() {
  const { zoneSlug } = useParams<{ zoneSlug: string }>();
  const { data: parkingLots, isLoading } = useParkingLots();
  
  const zoneConfig = zoneSlug ? ZONE_CONFIG[zoneSlug] : null;
  
  if (!zoneConfig) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Zone Not Found</h1>
          <p className="text-muted-foreground mb-4">The parking zone you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/citizen">
            <Button>Browse All Parking Lots</Button>
          </Link>
        </main>
      </div>
    );
  }
  
  const zoneLots = parkingLots?.filter(lot => lot.zone === zoneConfig.zone) || [];
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Parking in ${zoneConfig.name}, Delhi`,
    description: zoneConfig.metaDescription,
    itemListElement: zoneLots.map((lot, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'ParkingFacility',
        name: lot.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: zoneConfig.name,
          addressRegion: 'Delhi',
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: lot.lat,
          longitude: lot.lng,
        },
        openingHours: 'Mo-Su 00:00-23:59',
        priceRange: `₹${lot.hourly_rate}/hour`,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Parking in ${zoneConfig.name}`}
        description={zoneConfig.metaDescription}
        keywords={`${zoneConfig.name} parking, ${zoneConfig.zone} parking Delhi, parking near ${zoneConfig.landmarks.join(', ')}, MCD parking ${zoneConfig.name}`}
        canonicalUrl={`https://nigampark.in/parking/${zoneSlug}`}
        structuredData={structuredData}
      />
      
      <GovHeader />
      
      <main className="container py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-2">{zoneConfig.zone}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Parking in {zoneConfig.name}, Delhi
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {zoneConfig.description}
          </p>
        </div>
        
        {/* Landmarks */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Nearby Landmarks</h2>
          <div className="flex flex-wrap gap-2">
            {zoneConfig.landmarks.map(landmark => (
              <Badge key={landmark} variant="secondary" className="text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                {landmark}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Parking Lots */}
        <h2 className="text-xl font-semibold mb-4">Available Parking Lots</h2>
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : zoneLots.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No parking lots available in this zone currently.</p>
              <Link to="/citizen" className="mt-4 inline-block">
                <Button variant="outline">Browse All Parking Lots</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {zoneLots.map(lot => {
              const occupancyPercent = Math.round((lot.current_occupancy / lot.capacity) * 100);
              const availableSpots = lot.capacity - lot.current_occupancy;
              
              return (
                <Card key={lot.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{lot.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {lot.zone}
                        </CardDescription>
                      </div>
                      <Badge className={lot.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                        {lot.status === 'active' ? 'Open' : lot.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Occupancy</span>
                        <span className="text-muted-foreground">{availableSpots} spots free</span>
                      </div>
                      <Progress value={occupancyPercent} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <span className="font-semibold">₹{lot.hourly_rate}/hr</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Car className="h-4 w-4" />
                        <span>{lot.capacity} total</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link to={`/lot/${lot.id}`} className="flex-1">
                        <Button className="w-full" size="sm">
                          View Details
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${lot.lat},${lot.lng}`,
                            '_blank'
                          );
                        }}
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* SEO Content */}
        <section className="mt-12 prose prose-sm max-w-none">
          <h2 className="text-xl font-semibold">About Parking in {zoneConfig.name}</h2>
          <p className="text-muted-foreground">
            NIGAM-Park provides convenient and secure parking solutions in {zoneConfig.name}, {zoneConfig.zone}. 
            Our MCD-managed parking facilities offer real-time availability updates, online reservation, 
            and multiple payment options including UPI, cards, and cash. Book your parking spot in advance 
            to save time and avoid the hassle of searching for parking near popular destinations like{' '}
            {zoneConfig.landmarks.slice(0, 3).join(', ')}.
          </p>
          <h3 className="text-lg font-medium mt-4">Features</h3>
          <ul className="text-muted-foreground list-disc list-inside space-y-1">
            <li>Real-time parking availability updates</li>
            <li>Online slot reservation system</li>
            <li>Secure MCD-managed facilities</li>
            <li>Multiple payment options (UPI, Card, Cash)</li>
            <li>24/7 CCTV surveillance</li>
            <li>Attendant assistance available</li>
          </ul>
        </section>
        
        {/* Other Zones */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Explore Other Areas</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ZONE_CONFIG)
              .filter(([slug]) => slug !== zoneSlug)
              .map(([slug, config]) => (
                <Link key={slug} to={`/parking/${slug}`}>
                  <Button variant="outline" size="sm">
                    {config.name}
                  </Button>
                </Link>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
