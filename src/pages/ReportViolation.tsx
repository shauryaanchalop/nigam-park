import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, MapPin, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useCreateViolationReport, uploadViolationPhoto } from '@/hooks/useViolationReports';
import { toast } from 'sonner';

const VIOLATION_TYPES = [
  { value: 'illegal_parking', label: 'Illegal Parking' },
  { value: 'double_parking', label: 'Double Parking' },
  { value: 'blocking_entrance', label: 'Blocking Entrance/Exit' },
  { value: 'handicap_violation', label: 'Handicap Spot Violation' },
  { value: 'no_payment', label: 'No Payment/Ticket Display' },
  { value: 'overstay', label: 'Overstay Beyond Limit' },
  { value: 'other', label: 'Other Violation' },
];

export default function ReportViolation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: parkingLots } = useParkingLots();
  const createReport = useCreateViolationReport();
  
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [violationType, setViolationType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [lotId, setLotId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
          toast.success('Location captured');
        },
        () => {
          toast.error('Unable to get location');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a report');
      return;
    }

    if (!vehicleNumber || !violationType) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadViolationPhoto(photoFile, user.id);
      }

      await createReport.mutateAsync({
        vehicle_number: vehicleNumber.toUpperCase(),
        violation_type: violationType,
        description: description || undefined,
        photo_url: photoUrl,
        location: location || undefined,
        lot_id: lotId || undefined,
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader />
        <main className="container py-8">
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for helping keep our parking areas safe. Our team will review your report shortly.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/citizen')}>
                  Back to Portal
                </Button>
                <Button onClick={() => {
                  setIsSuccess(false);
                  setVehicleNumber('');
                  setViolationType('');
                  setDescription('');
                  setLocation('');
                  setLotId('');
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}>
                  Report Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      
      <main className="container py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/citizen')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portal
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Report Parking Violation</CardTitle>
                <CardDescription>
                  Help us maintain order by reporting illegally parked vehicles
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Number */}
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Number *</Label>
                <Input
                  id="vehicle"
                  placeholder="e.g., MH12AB1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="uppercase"
                  required
                />
              </div>

              {/* Violation Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Violation Type *</Label>
                <Select value={violationType} onValueChange={setViolationType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select violation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIOLATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parking Lot */}
              <div className="space-y-2">
                <Label htmlFor="lot">Parking Lot (Optional)</Label>
                <Select value={lotId} onValueChange={setLotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parking lot if applicable" />
                  </SelectTrigger>
                  <SelectContent>
                    {parkingLots?.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.name} - {lot.zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo Evidence</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Violation preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload a photo of the violation
                      </p>
                      <div className="flex gap-2 justify-center">
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                          />
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </span>
                          </Button>
                        </label>
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handlePhotoChange}
                          />
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              <Camera className="h-4 w-4 mr-2" />
                              Camera
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="Location coordinates or address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleGetLocation}>
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Additional Details</Label>
                <Textarea
                  id="description"
                  placeholder="Provide any additional details about the violation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !vehicleNumber || !violationType}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
