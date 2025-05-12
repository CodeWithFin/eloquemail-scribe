import React from 'react';
import Header from '../components/layout/Header';
import AISettings from '../components/settings/AISettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, UserCircle, Shield, Mail } from 'lucide-react';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-gray-600 mb-8">Manage your account and application preferences</p>
          
          <Tabs defaultValue="ai" className="space-y-6">
            <TabsList className="mb-6">
              <TabsTrigger value="account" className="flex items-center">
                <UserCircle className="mr-2 h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center">
                <SettingsIcon className="mr-2 h-4 w-4" />
                AI Features
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Privacy
              </TabsTrigger>
            </TabsList>
            
            {/* Account Settings */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Account settings will be implemented in future updates.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* AI Features Settings */}
            <TabsContent value="ai">
              <AISettings />
            </TabsContent>
            
            {/* Email Settings */}
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>
                    Manage your email preferences and connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Email settings will be implemented in future updates.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Privacy Settings */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Manage your privacy and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Privacy settings will be implemented in future updates.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings; 