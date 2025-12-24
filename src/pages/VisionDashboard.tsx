import { Link } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { CameraCard } from '@/components/vision/CameraCard';
import { useCameras } from '@/hooks/useCameras';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Wifi, WifiOff, AlertCircle, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import logo from '@/assets/logo.png';

export default function VisionDashboard() {
  const { user, userRole, loading } = useAuth();
  const { cameras, isLoading } = useCameras();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <img src={logo} alt="NIGAM-Park" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />
          <div className="chakra-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!user || (userRole !== 'admin' && userRole !== 'attendant')) {
    return <Navigate to="/auth" replace />;
  }

  // Calculate camera stats
  const onlineCameras = cameras?.filter(c => c.status === 'ONLINE').length || 0;
  const offlineCameras = cameras?.filter(c => c.status === 'OFFLINE').length || 0;
  const occludedCameras = cameras?.filter(c => c.status === 'OCCLUDED').length || 0;
  const totalDetections = cameras?.reduce((sum, c) => sum + (c.vision_events?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Camera className="w-7 h-7 text-primary" />
            Vision AI Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time computer vision surveillance with AI-powered object detection
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online Cameras</p>
                  <p className="text-2xl font-bold text-success">{onlineCameras}</p>
                </div>
                <Wifi className="w-8 h-8 text-success/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offline</p>
                  <p className="text-2xl font-bold text-destructive">{offlineCameras}</p>
                </div>
                <WifiOff className="w-8 h-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Occluded</p>
                  <p className="text-2xl font-bold text-warning">{occludedCameras}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Detections</p>
                  <p className="text-2xl font-bold text-cyan-500">{totalDetections}</p>
                </div>
                <Badge className="bg-cyan-500 text-background">LIVE</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Camera Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="p-0">
                  <Skeleton className="aspect-video w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras?.map((camera) => (
              <CameraCard key={camera.id} camera={camera} />
            ))}
          </div>
        )}

        {cameras && cameras.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No cameras configured</p>
              <p className="text-muted-foreground">Add cameras to start monitoring with Vision AI</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
