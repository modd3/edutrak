// src/components/academic/AcademicYearDetailsModal.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  School,
  ChevronRight,
  Edit,
  Plus,
  MoreVertical,
  Download,
  Printer,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AcademicYear } from '@/hooks/use-academic';

interface AcademicYearDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: AcademicYear | null;
}

export function AcademicYearDetailsModal({
  open,
  onOpenChange,
  academicYear,
}: AcademicYearDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!academicYear) return null;

  const startDate = new Date(academicYear.startDate);
  const endDate = new Date(academicYear.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);

  const currentTerm = academicYear.terms?.find(term => {
    const termStart = new Date(term.startDate);
    const termEnd = new Date(term.endDate);
    const now = new Date();
    return now >= termStart && now <= termEnd;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Calendar className="h-6 w-6" />
                Academic Year {academicYear.year}
              </DialogTitle>
              <DialogDescription>
                {format(startDate, 'MMMM d, yyyy')} - {format(endDate, 'MMMM d, yyyy')}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={academicYear.isActive ? "default" : "secondary"}>
                {academicYear.isActive ? (
                  <>
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="mr-1 h-3 w-3" />
                    Inactive
                  </>
                )}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Progress & Status */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Year Progress</CardTitle>
                <CardDescription>
                  {currentTerm ? `Currently in ${currentTerm.name}` : 'Academic year not in session'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Days Remaining</div>
                      <div className="text-2xl font-bold">{Math.max(totalDays - daysPassed, 0)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Total Duration</div>
                      <div className="text-2xl font-bold">{totalDays} days</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{academicYear._count?.classes || 0}</div>
                      <div className="text-sm text-muted-foreground">Classes</div>
                    </div>
                    <BookOpen className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{academicYear._count?.studentClasses || 0}</div>
                      <div className="text-sm text-muted-foreground">Students</div>
                    </div>
                    <Users className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{academicYear.terms?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Terms</div>
                    </div>
                    <Calendar className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
             {/* <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {academicYear._count?.classes?.reduce((acc, cls) => acc + (cls._count?.students || 0), 0) || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Enrolled</div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>  */}
            </div>

            {/* Terms Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Terms Schedule</CardTitle>
                <CardDescription>Academic terms for this year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {academicYear.terms?.map((term) => {
                    const termStart = new Date(term.startDate);
                    const termEnd = new Date(term.endDate);
                    const isCurrent = term.id === currentTerm?.id;
                    
                    return (
                      <div
                        key={term.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCurrent ? 'bg-primary/5 border-primary' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={isCurrent ? 'bg-primary text-primary-foreground' : ''}>
                              T{term.termNumber}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {term.name} • Term {term.termNumber}
                              {isCurrent && (
                                <Badge className="ml-2" variant="default">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(termStart, 'MMM d')} - {format(termEnd, 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.ceil((termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Academic Terms</h3>
                <p className="text-sm text-muted-foreground">
                  Manage terms for the {academicYear.year} academic year
                </p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Term
              </Button>
            </div>

            <div className="grid gap-4">
              {academicYear.terms?.map((term) => {
                const termStart = new Date(term.startDate);
                const termEnd = new Date(term.endDate);
                const daysDuration = Math.ceil((termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24));
                const isCurrent = term.id === currentTerm?.id;

                return (
                  <Card key={term.id} className={isCurrent ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-semibold">
                                {term.name} • Term {term.termNumber}
                              </h4>
                              {isCurrent && (
                                <Badge variant="default">Current</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(termStart, 'MMMM d, yyyy')} - {format(termEnd, 'MMMM d, yyyy')}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Duration</div>
                              <div className="font-medium">{daysDuration} days</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Status</div>
                              <div className="font-medium">
                                {new Date() > termEnd ? 'Completed' : new Date() < termStart ? 'Upcoming' : 'In Progress'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Weekdays</div>
                              <div className="font-medium">Mon - Fri</div>
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Term
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              View Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete Term
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Classes</h3>
                <p className="text-sm text-muted-foreground">
                  All classes for {academicYear.year} academic year
                </p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </div>

            <div className="grid gap-4">
            {/**
             * {academicYear.classes?.map((cls) => (
                <Card key={cls.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <School className="h-5 w-5 text-muted-foreground" />
                            <h4 className="text-lg font-semibold">{cls.name}</h4>
                            <Badge variant="outline">{cls.level}</Badge>
                            <Badge variant="secondary">{cls.curriculum}</Badge>
                            {cls.pathway && <Badge>{cls.pathway}</Badge>}
                          </div>
                          {cls.school && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {cls.school.name}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Students</div>
                            <div className="font-medium">{cls._count?.students || 0}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Streams</div>
                            <div className="font-medium">{cls.streams?.length || 0}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Subjects</div>
                            <div className="font-medium">{cls._count?.subjects || 0}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Teacher</div>
                            <div className="font-medium truncate">
                              {cls.classTeacher?.user
                                ? `${cls.classTeacher.user.firstName} ${cls.classTeacher.user.lastName}`
                                : 'Not Assigned'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          View Details
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Class
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Students
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="mr-2 h-4 w-4" />
                              Assign Subjects
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!academicYear.classes || academicYear.classes.length === 0) && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create classes to start enrolling students
                    </p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Class
                    </Button>
                  </CardContent>
                </Card>
              )}
             */}  
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Year
            </Button>
            <Button variant={academicYear.isActive ? "secondary" : "default"}>
              {academicYear.isActive ? 'Deactivate' : 'Set as Active'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}