import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Download, Printer, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ParkingLotQRCodeProps {
  lotId: string;
  lotName: string;
  zone: string;
}

export function ParkingLotQRCode({ lotId, lotName, zone }: ParkingLotQRCodeProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate the URL that the QR code will link to
  const baseUrl = window.location.origin;
  const lotUrl = `${baseUrl}/lot/${lotId}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(lotUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${lotId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;
      
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code centered
        ctx.drawImage(img, 50, 50, 300, 300);
        
        // Add text
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(lotName, canvas.width / 2, 400);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(zone, canvas.width / 2, 430);
        ctx.font = '12px Arial';
        ctx.fillText('Scan to view & reserve', canvas.width / 2, 460);
      }

      const link = document.createElement('a');
      link.download = `QR-${lotName.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR code downloaded');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = document.getElementById(`qr-${lotId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${lotName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
              border: 2px dashed #ccc;
              border-radius: 16px;
            }
            h1 { margin: 20px 0 8px; font-size: 24px; }
            p { margin: 0; color: #666; }
            .scan-text { margin-top: 16px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${svgData}
            <h1>${lotName}</h1>
            <p>${zone}</p>
            <p class="scan-text">Scan to view lot info & make reservations</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-auto">
          <QrCode className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden sm:inline">QR Code</span>
          <span className="sm:hidden">QR</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-base">QR Code for {lotName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          <Card className="bg-white p-3 sm:p-6">
            <CardContent className="p-0 flex flex-col items-center">
              <QRCodeSVG
                id={`qr-${lotId}`}
                value={lotUrl}
                size={150}
                level="H"
                includeMargin
                className="sm:w-[200px] sm:h-[200px]"
                imageSettings={{
                  src: '/favicon.png',
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
              <div className="text-center mt-3 sm:mt-4">
                <p className="font-semibold text-sm sm:text-base">{lotName}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{zone}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 w-full justify-center">
            <Button variant="outline" size="sm" className="flex-1 min-w-[80px] text-xs" onClick={handleCopyLink}>
              {copied ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 min-w-[80px] text-xs" onClick={handleDownload}>
              <Download className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="flex-1 min-w-[80px] text-xs" onClick={handlePrint}>
              <Printer className="h-3 w-3 mr-1" />
              Print
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground px-2">
            Place this QR code at the parking lot entrance for citizens to scan and quickly access lot information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
