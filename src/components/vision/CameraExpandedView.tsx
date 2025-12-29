import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Video, VideoOff, Eye, AlertTriangle, WifiOff, Maximize2, X } from 'lucide-react';
import { CameraWithEvents } from '@/types/ai-modules';
import { cn } from '@/lib/utils';
import cctvImage from '@/assets/cctv-parking.jpg';

interface CameraExpandedViewProps {
  camera: CameraWithEvents | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraExpandedView({ camera, open, onOpenChange }: CameraExpandedViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!camera) return null;

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
      year: 'numeric',
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              {camera.name}
              <Badge 
                variant={camera.status === 'ONLINE' ? 'default' : 'secondary'}
                className="ml-2"
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {camera.status}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{camera.zone}</p>
        </DialogHeader>

        <div className="relative w-full aspect-video bg-black">
          {/* ONLINE: Show normal CCTV feed */}
          {camera.status === 'ONLINE' && (
            <>
              <img
                src={cctvImage}
                alt={`Camera feed: ${camera.name}`}
                className="w-full h-full object-cover"
              />
              {/* Scanline overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply bg-[linear-gradient(transparent_0,transparent_2px,rgba(0,0,0,0.05)_3px)] bg-[length:100%_4px]" />
              {/* Vignette */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.35)_100%)]" />

              {/* AI Bounding Boxes */}
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
                      <div className="absolute -top-6 left-0 bg-cyan-400 text-background text-sm px-2 py-0.5 rounded whitespace-nowrap font-medium">
                        {event.object_type} #{index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detection Count */}
              {camera.vision_events && camera.vision_events.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-cyan-400/90 text-background text-sm px-3 py-1.5 rounded flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {camera.vision_events.length} objects detected
                </div>
              )}

              {/* REC Indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-destructive/90 text-destructive-foreground text-sm px-3 py-1.5 rounded">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                REC
              </div>
            </>
          )}

          {/* OFFLINE */}
          {camera.status === 'OFFLINE' && (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex flex-col items-center justify-center">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
              <WifiOff className="w-24 h-24 text-destructive mb-4 animate-pulse" />
              <p className="text-destructive font-bold text-2xl">NO SIGNAL</p>
              <p className="text-zinc-500 mt-2">Camera Disconnected</p>
              <div className="mt-6 px-4 py-2 bg-destructive/20 rounded border border-destructive/50">
                <p className="text-destructive font-mono">ERROR: CONNECTION_LOST</p>
              </div>
            </div>
          )}

          {/* OCCLUDED */}
          {camera.status === 'OCCLUDED' && (
            <div className="w-full h-full relative">
              <img
                src={cctvImage}
                alt={`Camera feed: ${camera.name}`}
                className="w-full h-full object-cover blur-xl brightness-50"
              />
              <div className="absolute inset-0 bg-warning/30 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="bg-background/90 backdrop-blur-md rounded-lg p-6 text-center shadow-lg border border-warning/50">
                  <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-3 animate-pulse" />
                  <p className="text-warning font-bold text-2xl">VIEW OBSTRUCTED</p>
                  <p className="text-muted-foreground mt-2">Camera lens blocked or dirty</p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Requires physical inspection
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded px-3 py-1.5">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                statusColors[camera.status],
                camera.status === 'ONLINE' && 'animate-pulse'
              )}
            />
            <span className="font-medium">
              {camera.status === 'ONLINE' ? 'LIVE' : camera.status}
            </span>
          </div>

          {/* Timestamp */}
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded font-mono flex flex-col items-end">
            <span className="text-lg font-bold">{formatCameraTime()}</span>
            <span className="text-sm text-muted-foreground">{formatCameraDate()}</span>
          </div>
        </div>

        {/* Camera Info Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Camera ID:</span>
              <span className="ml-2 font-mono">{camera.id.slice(0, 8)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Zone:</span>
              <span className="ml-2">{camera.zone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className={cn('ml-2 font-medium', 
                camera.status === 'ONLINE' && 'text-success',
                camera.status === 'OFFLINE' && 'text-destructive',
                camera.status === 'OCCLUDED' && 'text-warning'
              )}>
                {camera.status}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Detections:</span>
              <span className="ml-2">{camera.vision_events?.length || 0}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
