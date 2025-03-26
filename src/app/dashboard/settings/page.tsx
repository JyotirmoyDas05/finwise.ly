"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

interface UserSettings {
  profile: {
    name: string;
    email: string;
    image: string;
  };
  preferences: {
    aiStyle: "detailed" | "quick" | "balanced";
    notifications: {
      email: boolean;
      push: boolean;
      weeklyReport: boolean;
    };
  };
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: "",
      email: "",
      image: "",
    },
    preferences: {
      aiStyle: "balanced",
      notifications: {
        email: true,
        push: true,
        weeklyReport: true,
      },
    },
  });

  useEffect(() => {
    async function fetchUserSettings() {
      if (!user?.uid) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          router.push("/profile-setup");
          return;
        }

        const data = userDoc.data();
        setSettings({
          profile: {
            name: data.profile?.name || user.displayName || "",
            email: user.email || "",
            image: data.profile?.image || user.photoURL || "",
          },
          preferences: {
            aiStyle: data.settings?.aiPreference || "balanced",
            notifications: {
              email: data.settings?.notifications?.email ?? true,
              push: data.settings?.notifications?.push ?? true,
              weeklyReport: data.settings?.notifications?.weeklyReport ?? true,
            },
          },
        });
      } catch (error) {
        console.error("Error fetching user settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    fetchUserSettings();
  }, [user, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 1MB for base64)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Image size should be less than 1MB');
      return;
    }

    setUploading(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        
        // Update the settings state with the new image URL
        const updatedSettings = {
          ...settings,
          profile: {
            ...settings.profile,
            image: base64String
          }
        };
        setSettings(updatedSettings);

        // Update Firestore with the new image URL
        await updateDoc(doc(db, "users", user.uid), {
          profile: {
            ...updatedSettings.profile,
            image: base64String
          },
          updatedAt: new Date().toISOString(),
        });

        toast.success('Profile picture updated successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user?.uid || !settings.profile.image) return;

    setUploading(true);
    try {
      // Update the settings state
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          image: ''
        }
      }));

      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        profile: {
          ...settings.profile,
          image: ''
        },
        updatedAt: new Date().toISOString(),
      });

      toast.success('Profile picture removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        profile: {
          name: settings.profile.name,
          image: settings.profile.image,
        },
        settings: {
          aiPreference: settings.preferences.aiStyle,
          notifications: settings.preferences.notifications,
        },
        updatedAt: new Date().toISOString(),
      });

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={settings.profile.image} />
                  <AvatarFallback>
                    {settings.profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Change Photo"}
                  </Button>
                  {settings.profile.image && (
                    <Button 
                      variant="destructive" 
                      onClick={handleRemoveImage}
                      disabled={uploading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={settings.profile.name}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, name: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.profile.email}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>AI Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiStyle">Financial Advice Style</Label>
                <Select
                  value={settings.preferences.aiStyle}
                  onValueChange={(value: "detailed" | "quick" | "balanced") =>
                    setSettings((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        aiStyle: value,
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                    <SelectItem value="detailed">Detailed Analysis</SelectItem>
                    <SelectItem value="quick">Quick Tips</SelectItem>
                    <SelectItem value="balanced">Balanced Approach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.preferences.notifications.email}
                  onCheckedChange={(checked: boolean) =>
                    setSettings((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        notifications: {
                          ...prev.preferences.notifications,
                          email: checked,
                        },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates in browser
                  </p>
                </div>
                <Switch
                  checked={settings.preferences.notifications.push}
                  onCheckedChange={(checked: boolean) =>
                    setSettings((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        notifications: {
                          ...prev.preferences.notifications,
                          push: checked,
                        },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly financial summaries
                  </p>
                </div>
                <Switch
                  checked={settings.preferences.notifications.weeklyReport}
                  onCheckedChange={(checked: boolean) =>
                    setSettings((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        notifications: {
                          ...prev.preferences.notifications,
                          weeklyReport: checked,
                        },
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full mb-4 px-6 py-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>

          <Button
            onClick={async () => {
              try {
                await logout();
                router.push('/login');
              } catch (error) {
                toast.error('Failed to log out');
              }
            }}
            variant="outline"
            className="w-full px-6 py-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/50 hover:bg-destructive hover:text-white backdrop-blur-sm border-2 border-destructive/20 hover:border-destructive rounded-xl font-medium"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
} 