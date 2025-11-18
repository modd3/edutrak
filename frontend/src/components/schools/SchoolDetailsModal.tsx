import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import { School } from '@/types';
  import { SCHOOL_TYPES } from '@/lib/constants';
  import { MapPin, Phone, Mail, Globe, Building, Users, Home } from 'lucide-react';
import { SchoolFormModal } from './SchoolFormModal';
import { formatDate } from '@/lib/utils';
  
  interface SchoolDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    school: School;
  }
  
  // Helper function to format enum values for display
  const formatEnumValue = (value: string): string => {
    return value.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  export function SchoolDetailsModal({ open, onOpenChange, school }: SchoolDetailsModalProps) {
    const detailsSections = [
      {
        title: 'Basic Information',
        icon: Building,
        items: [
          { label: 'School Name', value: school.name },
          { label: 'School Type', value: SCHOOL_TYPES[school.type as keyof typeof SCHOOL_TYPES] },
          { label: 'Registration Number', value: school.registrationNo || 'Not provided' },
        { label: 'Ownership', value: formatEnumValue(school.ownership) },
      ],
    },
    {
      title: 'Location',
      icon: MapPin,
      items: [
        { label: 'County', value: school.county },
        { label: 'Sub-County', value: school.subCounty || 'Not provided' },
        { label: 'Ward', value: school.ward || 'Not provided' },
        { label: 'Address', value: school.address || 'Not provided' },
      ],
    },
    {
      title: 'Contact Information',
      icon: Phone,
      items: [
        { label: 'Phone', value: school.phone || 'Not provided' },
        { label: 'Email', value: school.email || 'Not provided' },
      ],
    },
    {
      title: 'School Details',
      icon: Users,
      items: [
        { label: 'Boarding Status', value: formatEnumValue(school.boardingStatus) },
        { label: 'Gender', value: formatEnumValue(school.gender) },
      ],
    },
    {
      title: 'Codes & Identifiers',
      icon: Globe,
      items: [
        { label: 'KNEC Code', value: school.knecCode || 'Not provided' },
        { label: 'KEMIS Code', value: school.kemisCode || 'Not provided' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {school.name}
          </DialogTitle>
          <DialogDescription>
            Complete school information and details
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
          {/* School Header */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary">
                {SCHOOL_TYPES[school.type as keyof typeof SCHOOL_TYPES]}
              </Badge>
              <Badge variant="outline">
                {formatEnumValue(school.ownership)}
              </Badge>
              <Badge variant="outline">
                {formatEnumValue(school.boardingStatus)}
              </Badge>
              <Badge variant="outline">
                {formatEnumValue(school.gender)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Located in {school.county}
              {school.subCounty && `, ${school.subCounty}`}
              {school.ward && `, ${school.ward}`}
            </p>
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {detailsSections.map((section, index) => (
              <div key={index} className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.label}:
                      </span>
                      <span className="text-sm text-right max-w-[200px]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          {(school.createdAt || school.updatedAt) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Home className="h-4 w-4" />
                System Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {school.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(school.createdAt)}</span>
                  </div>
                )}
                {school.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDate(school.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              
              <SchoolFormModal
                open={true}
                onOpenChange={onOpenChange}
                mode="edit"
                school={school}
              />
              // You can navigate to edit page here if needed
            }}
          >
            Edit School
          </Button>
        </div>
      </DialogContent>
      </Dialog>
  );
}