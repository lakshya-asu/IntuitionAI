import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const preferencesFormSchema = z.object({
  learningSpeed: z.number().min(1).max(5),
  dailyGoal: z.number().min(15).max(120),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

export default function Settings() {
  const { toast } = useToast();
  
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/user/settings"],
  });
  
  // Mock user persona data for demo
  const mockUserPersona = {
    id: 1,
    userId: 1,
    learningPreferences: "visual",
    contentFormat: ["video", "interactive", "text"],
    studyHabits: [
      "Prefers evening study sessions",
      "Needs frequent breaks",
      "Learns best with concrete examples",
      "Responsive to visual explanations"
    ],
    currentWeaknesses: [
      "Struggles with abstract quantum concepts",
      "Difficulty connecting philosophical theories to practical applications",
      "Challenges with complex mathematical proofs in machine learning"
    ],
    rawAnalysis: {}
  };
  
  // For demo purposes, we'll use the mock data instead of the API call
  const { data: userPersona, isLoading: personaLoading } = {
    data: mockUserPersona,
    isLoading: false
  };
  
  const isLoading = settingsLoading || personaLoading;

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      learningSpeed: 3,
      dailyGoal: 30,
      emailNotifications: true,
      pushNotifications: true,
    },
  });

  // Update form when data is loaded
  if (userSettings && !isLoading && profileForm.getValues().name === "") {
    profileForm.reset({
      name: userSettings.name,
      email: userSettings.email,
    });
    
    preferencesForm.reset({
      learningSpeed: userSettings.preferences.learningSpeed,
      dailyGoal: userSettings.preferences.dailyGoal,
      emailNotifications: userSettings.preferences.emailNotifications,
      pushNotifications: userSettings.preferences.pushNotifications,
    });
  }

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    try {
      await apiRequest("PUT", "/api/user/profile", values);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function onPreferencesSubmit(values: z.infer<typeof preferencesFormSchema>) {
    try {
      await apiRequest("PUT", "/api/user/preferences", values);
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Preferences updated",
        description: "Your learning preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="mt-2 text-slate-500">Manage your account and learning preferences</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Learning Preferences</TabsTrigger>
              <TabsTrigger value="learning-profile">Learning Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit">Save Profile</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                      <FormField
                        control={preferencesForm.control}
                        name="learningSpeed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Learning Speed</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Slower Pace</span>
                              <span>Faster Pace</span>
                            </div>
                            <FormDescription>
                              This affects how quickly new content is introduced
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="dailyGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Learning Goal (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={15} 
                                max={120} 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Set a daily time goal for your learning
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive learning reminders and updates via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Push Notifications</FormLabel>
                              <FormDescription>
                                Receive real-time alerts in your browser
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit">Save Preferences</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="learning-profile">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Learning Profile</CardTitle>
                  <CardDescription>
                    Your personalized learning profile generated from your interactions with the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userPersona ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Learning Preferences</h3>
                        <div className="bg-primary/5 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <span className="material-icons text-primary mr-2">psychology</span>
                            <span className="font-medium text-lg text-primary">{userPersona.learningPreferences}</span>
                          </div>
                          <p className="text-slate-600">Your primary learning preference indicates how you best process and retain information.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">Preferred Content Formats</h3>
                        <div className="flex flex-wrap gap-2">
                          {userPersona.contentFormat.map((format, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 capitalize">
                              {format === 'text' && <span className="material-icons mr-1 text-xs">description</span>}
                              {format === 'video' && <span className="material-icons mr-1 text-xs">videocam</span>}
                              {format === 'interactive' && <span className="material-icons mr-1 text-xs">touch_app</span>}
                              {format === 'audio' && <span className="material-icons mr-1 text-xs">headphones</span>}
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">Study Habits</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {userPersona.studyHabits.map((habit, index) => (
                            <li key={index} className="flex items-start">
                              <span className="material-icons text-primary mr-2 text-xs mt-1">check_circle</span>
                              <span className="text-slate-700">{habit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">Areas for Improvement</h3>
                        <ul className="space-y-2">
                          {userPersona.currentWeaknesses.map((weakness, index) => (
                            <li key={index} className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-700">
                              <div className="flex items-center">
                                <span className="material-icons mr-2 text-sm">priority_high</span>
                                <span>{weakness}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-100">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/user/persona"] });
                            toast({
                              title: "Refreshing learning profile",
                              description: "Updating your learning profile based on recent activity..."
                            });
                          }}
                          className="mt-2"
                        >
                          <span className="material-icons mr-2 text-sm">refresh</span>
                          Refresh Analysis
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto mb-4 bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center">
                        <span className="material-icons text-slate-400 text-2xl">psychology_alt</span>
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Learning Profile Yet</h3>
                      <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        Continue interacting with the chatbot and completing learning activities to generate your personalized learning profile.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          onClick={() => {
                            apiRequest("POST", "/api/user/analyze-persona", {})
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/user/persona"] });
                                toast({
                                  title: "Analysis started",
                                  description: "Analyzing your learning patterns. This may take a moment."
                                });
                              })
                              .catch(error => {
                                toast({
                                  title: "Error",
                                  description: error.message || "Failed to analyze learning profile. Try again after more interactions.",
                                  variant: "destructive"
                                });
                              });
                          }}
                        >
                          <span className="material-icons mr-2 text-sm">auto_awesome</span>
                          Generate Learning Profile
                        </Button>
                        
                        <Button 
                          variant="secondary"
                          onClick={() => {
                            toast({
                              title: "Generating demo profile",
                              description: "Creating a sample learning profile for demonstration..."
                            });
                            
                            apiRequest("POST", "/api/debug/generate-test-persona", {})
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/user/persona"] });
                                toast({
                                  title: "Demo profile created",
                                  description: "A sample learning profile has been generated for demonstration."
                                });
                              })
                              .catch(error => {
                                toast({
                                  title: "Generation failed",
                                  description: error.message || "Could not create the demo profile.",
                                  variant: "destructive"
                                });
                              });
                          }}
                        >
                          <span className="material-icons mr-2 text-sm">science</span>
                          Create Demo Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Change Password</h3>
                    <p className="text-slate-500 mb-4">Update your account password</p>
                    <Button variant="outline">Change Password</Button>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-lg font-medium mb-2">Data Export</h3>
                    <p className="text-slate-500 mb-4">Download all your learning data</p>
                    <Button variant="outline">Export Data</Button>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-slate-500 mb-4">Permanently delete your account and all data</p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}