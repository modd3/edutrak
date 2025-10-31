import { useParams, useNavigate } from 'react-router-dom';
import { useSchool } from '@/hooks/use-schools';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Building, Mail, Phone, MapPin } from 'lucide-react';
import { SCHOOL_TYPES } from '@/lib/constants';

// Helper component for displaying details
function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center space-x-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm">
        <strong className="text-muted-foreground">{label}:</strong> {value}
      </span>
    </div>
  );
}

export default function SchoolDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  if (!id) {
    navigate('/schools');
    return null;
  }

  const { data: school, isLoading, isError } = useSchool(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-1/2" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !school) {
    return <div className="text-center text-destructive">School not found.</div>;
  }

  const schoolTypeLabel = SCHOOL_TYPES[school.type as keyof typeof SCHOOL_TYPES] || school.type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Schools
        </Button>
        <Button onClick={() => navigate(`/schools/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit School
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{school.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge>{schoolTypeLabel}</Badge>
          <Badge variant="secondary">{school.county}</Badge>
          <Badge variant="secondary">{school.ownership}</Badge>
          <Badge variant="secondary">{school.gender}</Badge>
          <Badge variant="secondary">{school.boardingStatus}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem icon={Mail} label="Email" value={school.email} />
            <DetailItem icon={Phone} label="Phone" value={school.phone} />
            <DetailItem icon={MapPin} label="Address" value={school.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Official Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem icon={Building} label="Reg. No" value={school.registrationNo} />
            <DetailItem icon={Building} label="KNEC Code" value={school.knecCode} />
            <DetailItem icon={Building} label="NEMIS Code" value={save={school.nemisCode} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem icon={MapPin} label="County" value={school.county} />
            <DetailItem icon={MapPin} label="Sub-County" value={school.subCounty} />
            <DetailItem icon={MapPin} label="Ward" value={school.ward} />
          </CardContent>
        </Card>
      </div>
      
      {/* TODO: Add tabs for Students, Teachers, Classes as per your schema */}
    </div>
  );
}