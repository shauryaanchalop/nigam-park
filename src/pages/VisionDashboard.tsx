import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { CameraCard } from '@/components/vision/CameraCard';
import { CameraExpandedView } from '@/components/vision/CameraExpandedView';
import { VisionDetectionDemo } from '@/components/vision/VisionDetectionDemo';
import { LiveVisionCamera } from '@/components/vision/LiveVisionCamera';
import { CommissionerAlertBanner } from '@/components/alerts/CommissionerAlertBanner';
import { IncidentFeedPanel } from '@/components/alerts/IncidentFeedPanel';
import { useCameras } from '@/hooks/useCameras';
import { useIncidentAlerts } from '@/hooks/useIncidentAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Wifi, WifiOff, AlertCircle, ChevronLeft, Maximize, ScanLine, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CameraWithEvents } from '@/types/ai-modules';
import logo from '@/assets/logo.png';

export default function VisionDashboard() {
  const { user, userRole, loading } = useAuth();
  const { cameras, isLoading } = useCameras();
  const [searchParams] = useSearchParams();
  const deepLinkCameraId = searchParams.get('camera');
  const deepLinkIncidentId = searchParams.get('incident');

  const {
    activeIncident,
    setActiveIncident,
    acknowledgeIncident,
    resolveIncident,
    unresolvedIncidents,
    incidents,
  } = useIncidentAlerts();

  const [selectedCamera, setSelectedCamera] = useState<CameraWithEvents | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [showLiveVision, setShowLiveVision] = useState(false);
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(deepLinkCameraId);

  // Handle camera click
  const handleCameraClick = (camera: CameraWithEvents) => {
    setSelectedCamera(camera);
    setCameraDialogOpen(true);
  };

  // Focus a specific camera from alert banner or incident list
  const handleFocusCamera = useCallback((cameraId: string) => {
    setFocusedCameraId(cameraId);

    // Look for matching camera in fetched cameras
    const matched = cameras?.find(
      (c) => c.id.toLowerCase() === cameraId.toLowerCase() || c.name.toLowerCase().includes(cameraId.toLowerCase())
    );

    if (matched) {
      setSelectedCamera(matched);
      setCameraDialogOpen(true);
    } else {
      // Synthesize demo camera card so deep-linked camera always opens successfully
      const synthesized: CameraWithEvents = {
        id: cameraId,
        name: cameraId.replace(/_/g, ' '),
        zone: activeIncident?.lot_zone || 'Connaught Place - Block A Entry',
        status: 'ONLINE',
        stream_url: null,
        created_at: new Date().toISOString(),
        vision_events: [
          {
            id: 'ev-1',
            camera_id: cameraId,
            detected_at: new Date().toISOString(),
            object_type: 'Car (Collision)',
            bounding_box: { x: 80, y: 110, width: 120, height: 90 },
          },
        ],
      };
      setSelectedCamera(synthesized);
      setCameraDialogOpen(true);
    }
  }, [cameras, activeIncident?.lot_zone]);

  // Auto-focus camera on deep-link mount
  useEffect(() => {
    if (deepLinkCameraId) {
      handleFocusCamera(deepLinkCameraId);
    }
  }, [deepLinkCameraId, handleFocusCamera]);

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

  // In prototype / demo mode, allow evaluating the vision dashboard seamlessly

  const onlineCameras = cameras?.filter((c) => c.status === 'ONLINE').length || 0;
  const offlineCameras = cameras?.filter((c) => c.status === 'OFFLINE').length || 0;
  const occludedCameras = cameras?.filter((c) => c.status === 'OCCLUDED').length || 0;
  const totalDetections = cameras?.reduce((sum, c) => sum + (c.vision_events?.length || 0), 0) || 0;

  // Active incident overlay matching current camera if any
  const currentIncidentOverlay =
    activeIncident &&
    (activeIncident.camera_id === selectedCamera?.id ||
      activeIncident.camera_id.toLowerCase() === selectedCamera?.name.toLowerCase())
      ? activeIncident
      : incidents.find((i) => i.camera_id === selectedCamera?.id && i.status !== 'RESOLVED');

  const isSelectedCameraAlerted =
    Boolean(focusedCameraId && (selectedCamera?.id === focusedCameraId || selectedCamera?.name.includes(focusedCameraId))) ||
    Boolean(currentIncidentOverlay);

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />

      {/* Commissioner Real-Time Collision & Anomaly Alert Banner */}
      <CommissionerAlertBanner
        incident={activeIncident}
        onAcknowledge={(id) => acknowledgeIncident.mutate(id)}
        onResolve={(id) => resolveIncident.mutate({ id, status: 'RESOLVED' })}
        onStatusChange={(id, newStatus) => {
          setActiveIncident((prev) => (prev?.id === id ? { ...prev, status: newStatus } : prev));
        }}
        onDismiss={() => setActiveIncident(null)}
        onFocusCamera={handleFocusCamera}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={showLiveVision ? 'default' : 'secondary'}
              onClick={() => setShowLiveVision((v) => !v)}
            >
              <ScanLine className="w-4 h-4 mr-2" />
              {showLiveVision ? 'Hide Live Vision AI' : 'Show Vision AI in action'}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/kiosk">
                <Maximize className="w-4 h-4 mr-2" />
                Kiosk Mode
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Camera className="w-7 h-7 text-primary" />
                Vision AI & Collision Anomaly Command
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time zero-dataset heuristic tracking (YOLOv8 ByteTrack + IoU + Velocity shock analysis)
              </p>
            </div>
            {unresolvedIncidents.length > 0 && (
              <Badge variant="destructive" className="animate-pulse gap-1.5 px-3 py-1 text-xs uppercase font-bold">
                <Flame className="w-4 h-4 text-white" />
                {unresolvedIncidents.length} Critical Collision Alert{unresolvedIncidents.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {showLiveVision && (
          <div className="mb-6 animate-fade-in">
            <LiveVisionCamera />
          </div>
        )}

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
                  <p className="text-sm text-muted-foreground">Active Anomalies</p>
                  <p className="text-2xl font-bold text-destructive">{unresolvedIncidents.length}</p>
                </div>
                <Flame className="w-8 h-8 text-destructive/50 animate-pulse" />
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

        {/* Real-Time Camera Feeds & Anomaly Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Camera Feeds with Auto-Highlight */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Camera Feeds</CardTitle>
                <p className="text-xs text-muted-foreground">Click any camera to inspect with real-time AI bounding boxes</p>
              </div>
              {focusedCameraId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFocusedCameraId(null)}
                  className="text-xs h-7 text-muted-foreground"
                >
                  Clear Focus
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 sm:p-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-video w-full rounded-lg" />
                  ))}
                </div>
              ) : cameras && cameras.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 sm:p-4 max-h-[500px] overflow-y-auto">
                  {cameras.map((camera) => {
                    const isCameraAlerted =
                      Boolean(focusedCameraId && (camera.id === focusedCameraId || camera.name.includes(focusedCameraId))) ||
                      unresolvedIncidents.some(
                        (inc) => inc.camera_id === camera.id || camera.name.toLowerCase().includes(inc.camera_id.toLowerCase())
                      );

                    const cameraIncident = incidents.find(
                      (inc) => inc.camera_id === camera.id || camera.name.toLowerCase().includes(inc.camera_id.toLowerCase())
                    );

                    return (
                      <div
                        key={camera.id}
                        onClick={() => handleCameraClick(camera)}
                        className={`cursor-pointer rounded-lg transition-all ${
                          isCameraAlerted
                            ? 'ring-2 ring-red-500 shadow-lg'
                            : 'hover:ring-2 hover:ring-primary'
                        }`}
                      >
                        <CameraCard
                          camera={camera}
                          compact
                          isAlertHighlighted={isCameraAlerted}
                          incidentOverlay={cameraIncident}
                        />
                      </div>
                    );
                  })}
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

          {/* Right: Real-Time Anomaly & Incident Feed Panel */}
          <div className="space-y-6">
            <IncidentFeedPanel onFocusCamera={handleFocusCamera} />
            <VisionDetectionDemo />
          </div>
        </div>
      </main>

      {/* Expanded Camera Modal with Collision Overlay Support */}
      <CameraExpandedView
        camera={selectedCamera}
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        isAlertHighlighted={isSelectedCameraAlerted}
        incidentOverlay={currentIncidentOverlay}
      />
    </div>
  );
}

