import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bell, Shield, User, Lock, Moon, Sun, Smartphone, Mail, Globe } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

const Settings = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [securityAlerts, setSecurityAlerts] = useState(true);
    const [twoFactor, setTwoFactor] = useState(false);

    const handleSave = () => {
        toast({
            title: "Settings Updated",
            description: "Your preferences have been saved successfully.",
        });
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your account preferences and system configurations
                    </p>
                </div>

                <Tabs defaultValue="account" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 lg:w-[600px]">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    {/* Account Settings */}
                    <TabsContent value="account">
                        <Card className="soc-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Profile Information
                                </CardTitle>
                                <CardDescription>Update your personal details and public profile</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input id="username" defaultValue={user?.username} disabled />
                                        <p className="text-[10px] text-muted-foreground">Usernames cannot be changed.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" defaultValue={user?.email} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Input id="role" defaultValue={user?.role} disabled className="capitalize" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Input id="department" defaultValue="Security Operations" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSave}>Save Changes</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Notification Settings */}
                    <TabsContent value="notifications">
                        <Card className="soc-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-accent" />
                                    Notification Preferences
                                </CardTitle>
                                <CardDescription>Configure how and when you receive alerts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-base">Email Notifications</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Receive daily summaries and reports via email</p>
                                    </div>
                                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-base">Push Notifications</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Receive real-time alerts on your mobile device</p>
                                    </div>
                                    <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-base">Critical Security Alerts</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Always notify for high-severity incidents</p>
                                    </div>
                                    <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} disabled />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSave}>Save Preferences</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Appearance Settings */}
                    <TabsContent value="appearance">
                        <Card className="soc-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sun className="h-5 w-5 text-warning" />
                                    Appearance
                                </CardTitle>
                                <CardDescription>Customize the look and feel of the dashboard</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Theme</Label>
                                        <p className="text-sm text-muted-foreground">Select your preferred usage mode</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant={theme === 'light' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setTheme('light')}
                                            className="flex items-center gap-2"
                                        >
                                            <Sun className="h-4 w-4" /> Light
                                        </Button>
                                        <Button
                                            variant={theme === 'dark' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setTheme('dark')}
                                            className="flex items-center gap-2"
                                        >
                                            <Moon className="h-4 w-4" /> Dark
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Settings */}
                    <TabsContent value="security">
                        <Card className="soc-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-destructive" />
                                    Security & Authentication
                                </CardTitle>
                                <CardDescription>Manage your password and authentication methods</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Change Password</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input type="password" placeholder="Current Password" />
                                        <Input type="password" placeholder="New Password" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Two-Factor Authentication</Label>
                                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                                    </div>
                                    <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Active Sessions</Label>
                                        <p className="text-sm text-muted-foreground">Manage devices where you are logged in</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        View Sessions
                                    </Button>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSave}>Update Security Settings</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
};

export default Settings;
