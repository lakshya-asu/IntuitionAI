import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface ModuleEvent {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: "lesson" | "practice" | "assessment";
}

interface Module {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "upcoming";
  events: ModuleEvent[];
}

export default function CalendarPage() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedEvents, setSelectedEvents] = useState<ModuleEvent[]>([]);
  const [isGoogleAuthorized, setIsGoogleAuthorized] = useState(false);

  // Get available modules
  const { data: modules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/learning-path"],
  });

  // Handle module selection
  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
    
    if (modules) {
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        setSelectedEvents(module.events || []);
      } else {
        setSelectedEvents([]);
      }
    }
  };

  // Check if Google Calendar is authorized
  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        const response = await fetch('/api/auth/google/status');
        const data = await response.json();
        setIsGoogleAuthorized(data.isAuthorized);
      } catch (error) {
        console.error("Error checking Google auth status:", error);
        setIsGoogleAuthorized(false);
      }
    };

    checkGoogleAuth();
  }, []);

  // Handle Google Calendar authorization
  const handleGoogleAuth = async () => {
    // Redirect to Google OAuth consent screen
    window.location.href = '/api/auth/google';
  };

  // Handle adding events to calendar
  const handleAddToCalendar = async () => {
    if (!selectedModule || !selectedDate || !selectedEvents.length) {
      return;
    }

    try {
      const events = selectedEvents.map(event => {
        // Create a new date object for the event start time
        const eventDate = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
        
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: eventDate.toISOString(),
          endTime: new Date(eventDate.getTime() + event.duration * 60000).toISOString(),
          type: event.type
        };
      });

      const response = await fetch('/api/calendar/add-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error('Failed to add events to calendar');
      }

      const result = await response.json();
      alert(`Successfully added ${result.addedEvents} events to your calendar!`);
    } catch (error) {
      console.error('Error adding events to calendar:', error);
      alert('Failed to add events to your calendar. Please try again.');
    }
  };

  // Generate time slot options (9 AM to 9 PM)
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 9;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Learning Schedule</h1>
          <p className="mt-2 text-slate-500">Plan your learning sessions and add them to your calendar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module Selection */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Select a Module</CardTitle>
              <CardDescription>Choose a learning module to schedule</CardDescription>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : modules && modules.length > 0 ? (
                <div className="space-y-4">
                  <Label htmlFor="module-select">Learning Module</Label>
                  <Select value={selectedModule || undefined} onValueChange={handleModuleSelect}>
                    <SelectTrigger id="module-select">
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(module => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No modules available. Check your learning path.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date & Time Selection */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Choose Date & Time</CardTitle>
              <CardDescription>Select when you want to start your learning session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date-select" className="mb-2 block">Date</Label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
                <div>
                  <Label htmlFor="time-select" className="mb-2 block">Start Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger id="time-select">
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Summary & Google Calendar Integration */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Add to Calendar</CardTitle>
              <CardDescription>Schedule your learning session</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedModule && modules ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-slate-700 mb-2">Selected Module</h3>
                    <p className="text-slate-800">
                      {modules.find(m => m.id === selectedModule)?.title || 'Unknown module'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-slate-700 mb-2">Start Date & Time</h3>
                    <p className="text-slate-800">
                      {selectedDate ? format(selectedDate, 'PPP') : 'No date selected'} at {selectedTime}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-slate-700 mb-2">Sessions</h3>
                    {selectedEvents.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedEvents.map((event, index) => (
                          <li key={event.id} className="p-2 rounded-md bg-slate-100">
                            <div className="flex justify-between">
                              <span className="font-medium">{event.title}</span>
                              <span className="text-sm text-slate-500">{event.duration} min</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 text-sm">No sessions available for this module</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  Select a module to see calendar details
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {!isGoogleAuthorized ? (
                <Button 
                  onClick={handleGoogleAuth} 
                  className="w-full"
                  variant="outline"
                >
                  Connect Google Calendar
                </Button>
              ) : (
                <Button 
                  onClick={handleAddToCalendar} 
                  className="w-full"
                  disabled={!selectedModule || !selectedDate || selectedEvents.length === 0}
                >
                  Add to Google Calendar
                </Button>
              )}
              <div className="text-xs text-slate-500 text-center">
                {isGoogleAuthorized 
                  ? "Your Google Calendar account is connected" 
                  : "Connect your Google Calendar to schedule learning sessions"}
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}