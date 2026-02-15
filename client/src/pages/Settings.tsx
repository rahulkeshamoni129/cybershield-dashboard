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
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [securityAlerts, setSecurityAlerts] = useState(true);
    const [twoFactor, setTwoFactor] = useState(false);
    const [department, setDepartment] = useState(user?.department || 'Security Operations');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const handleSaveProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ department })
            });

            if (response.ok) {
                const data = await response.json();
                updateUser({ department: data.department });
                toast({
                    title: "Profile Updated",
                    description: "Your information has been saved successfully.",
                });
            } else {
                const data = await response.json();
                toast({
                    title: "Error",
                    description: data.message || "Failed to update profile",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while saving profile.",
                variant: "destructive"
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({
                title: "Error",
                description: "Please fill in all password fields.",
                variant: "destructive"
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match.",
                variant: "destructive"
            });
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/changepassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Password updated successfully.",
                });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Failed to update password.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while updating password.",
                variant: "destructive"
            });
        } finally {
            setIsUpdatingPassword(false);
        }
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
                                        <Input id="email" defaultValue={user?.email} disabled />
                                        <p className="text-[10px] text-muted-foreground">Registered email is permanent.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Input id="role" defaultValue={user?.role} disabled className="capitalize" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Input
                                            id="department"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveProfile} disabled={isUpdatingProfile}>
                                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                </Button>
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
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-base">System Audit Logging</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Log all administrative actions for compliance</p>
                                    </div>
                                    <Switch checked={true} disabled />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground italic">
                                    Integration for external Email/Push services is pending configuration.
                                </p>
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
                                <div className="space-y-4">
                                    <Label>Change Password</Label>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input
                                            type="password"
                                            placeholder="Current Password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                type="password"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <Input
                                                type="password"
                                                placeholder="Confirm New Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={isUpdatingPassword}
                                >
                                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
};

export default Settings;
