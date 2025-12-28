import { CameraWithEvents } from '@/types/ai-modules';
import { cn } from '@/lib/utils';
import { Camera, Video, VideoOff, Eye, AlertTriangle, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import cctvImage from '@/assets/cctv-parking.jpg';
import { useState, useEffect } from 'react';

interface CameraCardProps {
  camera: CameraWithEvents;
  compact?: boolean;
}

export function CameraCard({ camera, compact = false }: CameraCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statusColors = {
    ONLINE: 'bg-success',
    OFFLINE: 'bg-destructive',
    OCCLUDED: 'bg-warning',
  };

  const statusIcons = {
    ONLINE: Video,
    OFFLINE: VideoOff,
    OCCLUDED: Eye,
  };

  const StatusIcon = statusIcons[camera.status];

  // Format time with milliseconds for more realistic CCTV feel
  const formatCameraTime = () => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatCameraDate = () => {
    return currentTime.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden data-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            {camera.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', statusColors[camera.status])} />
            <Badge 
              variant={camera.status === 'ONLINE' ? 'default' : 'secondary'}
              className="text-xs"
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {camera.status}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{camera.zone}</p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Camera Feed Container with AI Overlay */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          
          {/* ONLINE: Show normal CCTV feed */}
          {camera.status === 'ONLINE' && (
            <>
              <img 
                src={cctvImage}
                alt={`Camera feed: ${camera.name}`}
                className="w-full h-full object-cover"
              />
              {/* Scanline overlay for CCTV effect */}
              <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply bg-[linear-gradient(transparent_0,transparent_2px,rgba(0,0,0,0.05)_3px)] bg-[length:100%_4px]" />
              {/* Subtle vignette */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.35)_100%)]" />

              {/* AI Bounding Boxes Overlay */}
              <div className="absolute inset-0">
                {camera.vision_events?.map((event, index) => {
                  const box = event.bounding_box;
                  return (
                    <div
                      key={event.id}
                      className="absolute border-2 border-cyan-400 rounded"
                      style={{
                        left: `${(box.x / 400) * 100}%`,
                        top: `${(box.y / 300) * 100}%`,
                        width: `${(box.width / 400) * 100}%`,
                        height: `${(box.height / 300) * 100}%`,
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      <div className="absolute -top-5 left-0 bg-cyan-400 text-background text-xs px-1 rounded whitespace-nowrap">
                        {event.object_type} #{index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Detection Count */}
              {camera.vision_events && camera.vision_events.length > 0 && (
                <div className="absolute bottom-2 left-2 bg-cyan-400/90 text-background text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {camera.vision_events.length} objects detected
                </div>
              )}
            </>
          )}

          {/* OFFLINE: Show "No Signal" screen */}
          {camera.status === 'OFFLINE' && (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex flex-col items-center justify-center">
              {/* Static noise effect */}
              <div className="absolute inset-0 opacity-20" 
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
              <WifiOff className="w-16 h-16 text-destructive mb-3 animate-pulse" />
              <p className="text-destructive font-bold text-lg">NO SIGNAL</p>
              <p className="text-zinc-500 text-xs mt-1">Camera Disconnected</p>
              <div className="mt-4 px-3 py-1 bg-destructive/20 rounded border border-destructive/50">
                <p className="text-destructive text-xs font-mono">ERROR: CONNECTION_LOST</p>
              </div>
            </div>
          )}

          {/* OCCLUDED: Show obscured/blocked camera view */}
          {camera.status === 'OCCLUDED' && (
            <div className="w-full h-full relative">
              {/* Blurred/obscured background */}
              <img 
                src={cctvImage}
                alt={`Camera feed: ${camera.name}`}
                className="w-full h-full object-cover blur-xl brightness-50"
              />
              {/* Overlay with warning */}
              <div className="absolute inset-0 bg-warning/30 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="bg-background/90 backdrop-blur-md rounded-lg p-4 text-center shadow-lg border border-warning/50">
                  <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-2 animate-pulse" />
                  <p className="text-warning font-bold text-lg">VIEW OBSTRUCTED</p>
                  <p className="text-muted-foreground text-xs mt-1">Camera lens blocked or dirty</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Requires physical inspection
                  </div>
                </div>
              </div>
              {/* Corner warning indicators */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-warning animate-pulse" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-warning animate-pulse" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-warning animate-pulse" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-warning animate-pulse" />
            </div>
          )}

          {/* Camera Status Indicator - always visible */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              statusColors[camera.status],
              camera.status === 'ONLINE' && 'animate-pulse'
            )} />
            <span className="text-xs font-medium">
              {camera.status === 'ONLINE' ? 'LIVE' : camera.status}
            </span>
          </div>

          {/* Real-time Timestamp overlay - always visible */}
          <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded font-mono flex flex-col items-end">
            <span className="text-foreground">{formatCameraTime()}</span>
            <span className="text-muted-foreground text-[10px]">{formatCameraDate()}</span>
          </div>

          {/* REC indicator for online cameras */}
          {camera.status === 'ONLINE' && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              REC
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
