import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { CameraCard } from '@/components/vision/CameraCard';
import { CameraExpandedView } from '@/components/vision/CameraExpandedView';
import { VisionDetectionDemo } from '@/components/vision/VisionDetectionDemo';
import { useCameras } from '@/hooks/useCameras';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Wifi, WifiOff, AlertCircle, ChevronLeft, Maximize } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamDialog } from '@/components/TeamDialog';
import { CameraWithEvents } from '@/types/ai-modules';
import logo from '@/assets/logo.png';

export default function VisionDashboard() {
  const { user, userRole, loading } = useAuth();
  const { cameras, isLoading } = useCameras();
  const [selectedCamera, setSelectedCamera] = useState<CameraWithEvents | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);

  const handleCameraClick = (camera: CameraWithEvents) => {
    setSelectedCamera(camera);
    setCameraDialogOpen(true);
  };

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

  const onlineCameras = cameras?.filter(c => c.status === 'ONLINE').length || 0;
  const offlineCameras = cameras?.filter(c => c.status === 'OFFLINE').length || 0;
  const occludedCameras = cameras?.filter(c => c.status === 'OCCLUDED').length || 0;
  const totalDetections = cameras?.reduce((sum, c) => sum + (c.vision_events?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <TeamDialog />
            <Button variant="outline" asChild>
              <Link to="/kiosk">
                <Maximize className="w-4 h-4 mr-2" />
                Kiosk Mode
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Camera className="w-7 h-7 text-primary" />
            Vision AI Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time computer vision surveillance with AI-powered object detection
          </p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <VisionDetectionDemo />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Camera Feeds</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-2 p-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-video w-full rounded-lg" />
                  ))}
                </div>
              ) : cameras && cameras.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 p-4 max-h-[400px] overflow-y-auto">
                  {cameras.map((camera) => (
                    <div 
                      key={camera.id} 
                      onClick={() => handleCameraClick(camera)}
                      className="cursor-pointer hover:ring-2 hover:ring-primary rounded-lg transition-all"
                    >
                      <CameraCard camera={camera} compact />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No cameras configured</p>
                  <p className="text-muted-foreground text-sm">Add cameras to start monitoring</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <CameraExpandedView 
        camera={selectedCamera}
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
      />
    </div>
  );
}
