import { CameraWithEvents } from '@/types/ai-modules';
import { cn } from '@/lib/utils';
import { Camera, Video, VideoOff, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import cctvImage from '@/assets/cctv-parking.jpg';

interface CameraCardProps {
  camera: CameraWithEvents;
}

export function CameraCard({ camera }: CameraCardProps) {
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
          {/* Realistic CCTV Image */}
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

          {/* Camera Status Indicator */}
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

          {/* AI Detection Count */}
          {camera.vision_events && camera.vision_events.length > 0 && (
            <div className="absolute bottom-2 left-2 bg-cyan-400/90 text-background text-xs px-2 py-1 rounded flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {camera.vision_events.length} objects detected
            </div>
          )}

          {/* Timestamp overlay */}
          <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
