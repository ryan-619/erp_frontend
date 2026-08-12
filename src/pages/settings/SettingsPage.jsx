// ====================================================================
// Module: Settings
// Page: Settings
//
// Purpose:
// Configure school-wide system and preference settings.
//
// Data Source:
// N/A
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useState } from 'react'
import { Save, Building, Bell, Shield, Palette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import PageHeader from '@/components/PageHeader'
import { useTheme } from '@/context/ThemeContext'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [notify, setNotify] = useState({ email: true, push: false, weekly: true })

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Administration' }, { label: 'Settings' }]} />
      <PageHeader
        title="Settings"
        description="Manage your account and platform preferences."
        actions={<Button><Save className="mr-2 h-4 w-4" /> Save changes</Button>}
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Building className="mr-2 h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Security</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Organization</CardTitle><CardDescription>Update your organization details.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="org">Organization name</Label><Input id="org" defaultValue="Scholaria ERP" /></div>
              <div className="space-y-2"><Label htmlFor="sub">Primary domain</Label><Input id="sub" defaultValue="scholaria.io" /></div>
              <div className="space-y-2">
                <Label>Default language</Label>
                <Select defaultValue="en"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="es">Spanish</SelectItem><SelectItem value="fr">French</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select defaultValue="utc"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="utc">UTC</SelectItem><SelectItem value="est">EST (UTC-5)</SelectItem><SelectItem value="pst">PST (UTC-8)</SelectItem></SelectContent></Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Notification preferences</CardTitle><CardDescription>Choose how you want to be notified.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'email', label: 'Email notifications', desc: 'Receive alerts via email' },
                { key: 'push', label: 'Push notifications', desc: 'Real-time browser push' },
                { key: 'weekly', label: 'Weekly digest', desc: 'Summary of platform activity' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                  <Switch checked={notify[n.key]} onCheckedChange={(v) => setNotify((s) => ({ ...s, [n.key]: v }))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Security</CardTitle><CardDescription>Manage password and access settings.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="cur">Current password</Label><Input id="cur" type="password" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="new">New password</Label><Input id="new" type="password" /></div>
                <div className="space-y-2"><Label htmlFor="conf">Confirm password</Label><Input id="conf" type="password" /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="text-sm font-medium">Two-factor authentication</p><p className="text-xs text-muted-foreground">Add an extra layer of security</p></div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Appearance</CardTitle><CardDescription>Customize how the console looks.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${theme === t ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                >
                  <div><p className="text-sm font-medium capitalize">{t}</p><p className="text-xs text-muted-foreground">{t === 'system' ? 'Match OS preference' : `${t} mode`}</p></div>
                  {theme === t && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
