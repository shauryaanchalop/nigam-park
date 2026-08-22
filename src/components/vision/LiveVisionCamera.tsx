import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import {
  Camera as CameraIcon,
  FileDown,
  Eye,
  EyeOff,
  CameraOff,
  ScanLine,
  Loader2,
  Upload,
  Car,
  AlertTriangle,
  History,
  Trash2,
} from 'lucide-react';

type DetectionStatus = 'CLEAR' | 'OCCLUDED' | 'BLOCKED';
type AnprMode = 'strict' | 'relaxed';

interface QualityScores {
  blur: number;
  glare: number;
  occlusion: number;
  note?: string;
}

interface Box {
  label: string;
  confidence: number;
  box: [number, number, number, number];
  kind: 'plate' | 'object';
  status: DetectionStatus;
  note?: string;
  quality?: QualityScores;
}

interface HistoryEntry {
  id: string;
  at: Date;
  thumb: string;
  source: 'camera' | 'upload';
  mode: AnprMode;
  minConfidence: number;
  boxes: Box[];
  summary: string;
  frameQuality: string;
  quality: QualityScores | null;
}

interface VisionResult {
  plates?: {
    text: string;
    confidence?: number;
    box?: number[];
    status?: string;
    note?: string;
    quality?: Partial<QualityScores>;
  }[];
  objects?: { label: string; confidence?: number; box?: number[]; status?: string }[];
  frame_quality?: string;
  quality_scores?: Partial<QualityScores>;
  summary?: string;
  error?: string;
}

const normalizeStatus = (s?: string): DetectionStatus => {
  const v = String(s ?? '').toUpperCase();
  return v === 'OCCLUDED' || v === 'BLOCKED' ? v : 'CLEAR';
};

const STATUS_STYLES: Record<DetectionStatus, { border: string; chip: string; label: string }> = {
  CLEAR: { border: 'border-emerald-400', chip: 'bg-emerald-400 text-background', label: 'Clear' },
  OCCLUDED: { border: 'border-warning', chip: 'bg-warning text-background', label: 'Occluded' },
  BLOCKED: { border: 'border-destructive', chip: 'bg-destructive text-destructive-foreground', label: 'Blocked' },
};


const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

function normalizeBox(box?: number[]): [number, number, number, number] | null {
  if (!box || box.length < 4) return null;
  let [x, y, w, h] = box.map(Number);
  // Some models return 0-100 or 0-1000 scales
  const max = Math.max(x, y, w, h);
  if (max > 1.5) {
    const scale = max > 100 ? 1000 : 100;
    x /= scale; y /= scale; w /= scale; h /= scale;
  }
  return [clamp01(x), clamp01(y), clamp01(w), clamp01(h)];
}

export function LiveVisionCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzingRef = useRef(false);
  const { toast } = useToast();

  const [cameraOn, setCameraOn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [frameQuality, setFrameQuality] = useState<string>('');
  const [quality, setQuality] = useState<QualityScores | null>(null);
  const [mode, setMode] = useState<AnprMode>('strict');
  const [minConfidence, setMinConfidence] = useState(40);
  const [history, setHistory] = useState<HistoryEntry[]>([]);


  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    setAutoScan(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    try {
      setError('');
      setUploadedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      // wait for the video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      }, 0);
    } catch (e) {
      setError('Camera access denied or unavailable. You can upload an image instead.');
      toast({
        title: 'Camera unavailable',
        description: 'Allow camera permission in your browser, or upload a photo to test detection.',
        variant: 'destructive',
      });
    }
  };

  const captureFrame = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const source: HTMLVideoElement | HTMLImageElement | null = uploadedImage
      ? imageRef.current
      : videoRef.current;
    if (!source) return null;

    const w = uploadedImage
      ? (source as HTMLImageElement).naturalWidth
      : (source as HTMLVideoElement).videoWidth;
    const h = uploadedImage
      ? (source as HTMLImageElement).naturalHeight
      : (source as HTMLVideoElement).videoHeight;
    if (!w || !h) return null;

    const scale = Math.min(1, 1600 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const analyze = useCallback(async () => {
    if (analyzingRef.current) return;
    const frame = captureFrame();
    if (!frame) {
      setError('No frame available yet — start the camera or upload an image.');
      return;
    }
    analyzingRef.current = true;
    setAnalyzing(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke<VisionResult>('vision-detect', {
        body: { image: frame, mode, min_confidence: minConfidence / 100 },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const threshold = minConfidence / 100;
      const next: Box[] = [];
      (data?.plates ?? []).forEach((p) => {
        const b = normalizeBox(p.box);
        const conf = p.confidence ?? 0.9;
        if (b && conf >= threshold)
          next.push({
            label: p.text,
            confidence: conf,
            box: b,
            kind: 'plate',
            status: normalizeStatus(p.status),
            note: p.note,
            quality: p.quality
              ? {
                  blur: clamp01(Number(p.quality.blur ?? 0)),
                  glare: clamp01(Number(p.quality.glare ?? 0)),
                  occlusion: clamp01(Number(p.quality.occlusion ?? 0)),
                }
              : undefined,
          });
      });
      (data?.objects ?? []).forEach((o) => {
        const b = normalizeBox(o.box);
        const conf = o.confidence ?? 0.8;
        if (b && conf >= threshold)
          next.push({
            label: o.label,
            confidence: conf,
            box: b,
            kind: 'object',
            status: normalizeStatus(o.status),
          });
      });
      const q: QualityScores | null = data?.quality_scores
        ? {
            blur: clamp01(Number(data.quality_scores.blur ?? 0)),
            glare: clamp01(Number(data.quality_scores.glare ?? 0)),
            occlusion: clamp01(Number(data.quality_scores.occlusion ?? 0)),
            note: data.quality_scores.note,
          }
        : null;
      const summaryText =
        data?.summary || (next.length ? `${next.length} detections` : 'No objects detected');
      setBoxes(next);
      setQuality(q);
      setFrameQuality(data?.frame_quality ?? '');
      setSummary(summaryText);
      const now = new Date();
      setLastRun(now);
      setHistory((h) =>
        [
          {
            id: `${now.getTime()}`,
            at: now,
            thumb: frame,
            source: uploadedImage ? ('upload' as const) : ('camera' as const),
            mode,
            minConfidence,
            boxes: next,
            summary: summaryText,
            frameQuality: data?.frame_quality ?? '',
            quality: q,
          },
          ...h,
        ].slice(0, 12),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Vision AI request failed';
      setError(message);
      setAutoScan(false);
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImage, mode, minConfidence]);


  useEffect(() => {
    if (!autoScan) return;
    analyze();
    const id = setInterval(() => analyze(), 6000);
    return () => clearInterval(id);
  }, [autoScan, analyze]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(String(reader.result));
      setBoxes([]);
      setSummary('');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const exportPdf = () => {
    if (!boxes.length && !summary) {
      toast({ title: 'Nothing to export', description: 'Run a detection first.', variant: 'destructive' });
      return;
    }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;

    doc.setFontSize(16);
    doc.text('MCD Smart Parking — Vision AI Detection Report', margin, y);
    y += 18;
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 13;
    doc.text(`Source: ${uploadedImage ? 'Uploaded image' : 'Live camera frame'}`, margin, y);
    y += 13;
    doc.text(`Frame quality: ${frameQuality || 'N/A'}`, margin, y);
    y += 22;
    doc.setTextColor(0);

    const frame = captureFrame();
    if (frame) {
      const canvas = canvasRef.current;
      const ratio = canvas ? canvas.height / canvas.width : 0.5625;
      const w = 515;
      const h = Math.min(300, w * ratio);
      try {
        doc.addImage(frame, 'JPEG', margin, y, w, h);
        y += h + 20;
      } catch { /* ignore image failures */ }
    }

    doc.setFontSize(12);
    doc.text(`Number plates (${plates.length})`, margin, y);
    y += 15;
    doc.setFontSize(10);
    if (!plates.length) {
      doc.text('No plates detected.', margin, y);
      y += 14;
    }
    plates.forEach((p) => {
      doc.text(
        `• ${p.label} — ${Math.round(p.confidence * 100)}% — ${STATUS_STYLES[p.status].label}${p.note ? ` (${p.note})` : ''}`,
        margin,
        y,
      );
      y += 14;
    });

    y += 10;
    doc.setFontSize(12);
    doc.text(`Objects (${objects.length})`, margin, y);
    y += 15;
    doc.setFontSize(10);
    if (!objects.length) {
      doc.text('No objects detected.', margin, y);
      y += 14;
    }
    objects.forEach((o) => {
      if (y > 780) { doc.addPage(); y = margin; }
      doc.text(`• ${o.label} — ${Math.round(o.confidence * 100)}% — ${STATUS_STYLES[o.status].label}`, margin, y);
      y += 14;
    });

    if (summary) {
      y += 12;
      doc.setFontSize(11);
      doc.text(doc.splitTextToSize(`Summary: ${summary}`, 515), margin, y);
    }

    doc.save(`vision-ai-report-${Date.now()}.pdf`);
    toast({ title: 'Report exported', description: 'Vision AI detection summary saved as PDF.' });
  };

  const plates = boxes.filter((b) => b.kind === 'plate');
  const objects = boxes.filter((b) => b.kind === 'object');
  const hasSource = cameraOn || !!uploadedImage;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Live Vision AI — ANPR &amp; Object Detection
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">REAL AI · LIVE CAMERA</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Point your camera at a vehicle (or upload a photo). The AI reads number plates and draws bounding
          boxes around detected objects in real time.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {!cameraOn ? (
            <Button onClick={startCamera} size="sm">
              <CameraIcon className="h-4 w-4 mr-2" /> Start camera
            </Button>
          ) : (
            <Button onClick={stopCamera} size="sm" variant="outline">
              <CameraOff className="h-4 w-4 mr-2" /> Stop camera
            </Button>
          )}

          <Button onClick={analyze} size="sm" variant="secondary" disabled={!hasSource || analyzing}>
            {analyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ScanLine className="h-4 w-4 mr-2" />
            )}
            {analyzing ? 'Analysing…' : 'Detect now'}
          </Button>

          <Button size="sm" variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" /> Upload image
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </Button>

          <Button onClick={exportPdf} size="sm" variant="outline" disabled={!boxes.length && !summary}>
            <FileDown className="h-4 w-4 mr-2" /> Export PDF
          </Button>

          <Button
            onClick={() => setShowOverlay((v) => !v)}
            size="sm"
            variant={showOverlay ? 'secondary' : 'outline'}
          >
            {showOverlay ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showOverlay ? 'Overlay on' : 'Overlay off'}
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Switch id="auto-scan" checked={autoScan} onCheckedChange={setAutoScan} disabled={!hasSource} />
            <Label htmlFor="auto-scan" className="text-sm">Auto-scan (6s)</Label>
          </div>
        </div>

        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border">
          {uploadedImage ? (
            <img ref={imageRef} src={uploadedImage} alt="Uploaded frame for vision analysis" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover ${cameraOn ? '' : 'opacity-0'}`}
            />
          )}

          {!hasSource && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <CameraIcon className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Camera feed is off</p>
              <p className="text-sm text-muted-foreground">
                Start the camera or upload an image to run live detection.
              </p>
            </div>
          )}

          {/* Bounding boxes */}
          {showOverlay && boxes.map((b, i) => (
            <div
              key={`${b.label}-${i}`}
              className={`absolute border-2 rounded-sm pointer-events-none transition-all duration-300 ${
                b.status === 'CLEAR'
                  ? b.kind === 'plate'
                    ? 'border-warning'
                    : 'border-cyan-400'
                  : STATUS_STYLES[b.status].border
              } ${b.status === 'BLOCKED' ? 'border-dashed' : ''}`}
              style={{
                left: `${b.box[0] * 100}%`,
                top: `${b.box[1] * 100}%`,
                width: `${b.box[2] * 100}%`,
                height: `${b.box[3] * 100}%`,
              }}
            >
              <span
                className={`absolute -top-6 left-0 text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${
                  b.status !== 'CLEAR'
                    ? STATUS_STYLES[b.status].chip
                    : b.kind === 'plate'
                      ? 'bg-warning text-background'
                      : 'bg-cyan-400 text-background'
                }`}
              >
                {b.label} {Math.round((b.confidence ?? 0) * 100)}%
                {b.status !== 'CLEAR' ? ` · ${STATUS_STYLES[b.status].label}` : ''}
              </span>
            </div>
          ))}

          {analyzing && (
            <div className="absolute inset-x-0 top-0 h-1 bg-primary/20 overflow-hidden">
              <div className="h-full w-1/3 bg-primary animate-[shimmer_1.2s_infinite] " style={{ animation: 'ping 1.2s linear infinite' }} />
            </div>
          )}

          {hasSource && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              <span className="text-[10px] font-medium">
                {cameraOn ? 'LIVE FEED' : 'STILL FRAME'}
              </span>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Number plates ({plates.length})
            </p>
            {plates.length ? (
              <div className="space-y-1.5">
                {plates.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-warning/5">
                    <div className="min-w-0">
                      <span className="font-mono font-semibold">{p.label}</span>
                      {p.note && <p className="text-[11px] text-muted-foreground truncate">{p.note}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant={p.status === 'CLEAR' ? 'secondary' : 'destructive'}
                        className="text-[10px]"
                      >
                        {STATUS_STYLES[p.status].label}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {Math.round(p.confidence * 100)}% conf
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No plate read yet.</p>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Objects ({objects.length})
            </p>
            {objects.length ? (
              <div className="flex flex-wrap gap-1.5">
                {objects.map((o, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    <Car className="h-3 w-3" />
                    {o.label} · {Math.round(o.confidence * 100)}%
                    {o.status !== 'CLEAR' ? ` · ${STATUS_STYLES[o.status].label}` : ''}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No objects detected yet.</p>
            )}
          </div>
        </div>

        {(summary || lastRun) && (
          <p className="text-xs text-muted-foreground border-t pt-3">
            {summary}
            {frameQuality ? ` · frame: ${frameQuality}` : ''}
            {lastRun ? ` · last scan ${lastRun.toLocaleTimeString()}` : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
