// ====================================================================
// Module: Settings
// Page: General Settings
//
// Purpose:
// Configure school-wide general information (name, branding, localization).
//
// Backend fields: school_name, logo, theme, timezone, date_format,
//                 currency, language, config (Mixed)
// ====================================================================

import { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { FormSection } from '@/components/FormSection'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useGeneralSettings } from '@/hooks/useSettings'

const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
const TIMEZONES = ['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Dubai', 'Asia/Tokyo']
const THEMES = ['light', 'dark', 'system']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY']
const LANGUAGES = ['en', 'es', 'fr', 'de', 'hi', 'ar']

export default function GeneralSettingsPage() {
  const { settings, isLoading, updateSettings } = useGeneralSettings()
  const [form, setForm] = useState({
    school_name: '',
    logo: '',
    theme: 'light',
    timezone: '',
    date_format: '',
    currency: '',
    language: '',
  })

  // Only update form when settings actually change (use JSON.stringify for deep comparison)
  useEffect(() => {
    if (settings && !isLoading) {
      const newForm = {
        school_name: settings.school_name || '',
        logo: settings.logo || '',
        theme: settings.theme || 'light',
        timezone: settings.timezone || '',
        date_format: settings.date_format || '',
        currency: settings.currency || '',
        language: settings.language || '',
      }
      setForm(newForm)
    }
  }, [JSON.stringify(settings), isLoading])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSave = () => updateSettings(form)
  const handleReset = () => {
    if (settings) {
      setForm({
        school_name: settings.school_name || '',
        logo: settings.logo || '',
        theme: settings.theme || 'light',
        timezone: settings.timezone || '',
        date_format: settings.date_format || '',
        currency: settings.currency || '',
        language: settings.language || '',
      })
    }
  }

  if (isLoading) return <LoadingSkeleton variant="cards" />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'General' }]} />
      <PageHeader
        title="General Settings"
        description="Manage your school's basic information and branding."
        icon={Settings}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">School Information</CardTitle>
          <CardDescription>Basic details about your institution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormSection title="Identity" columns={2}>
            <div className="space-y-1.5">
              <Label className="text-xs">School Name <span className="text-destructive">*</span></Label>
              <Input value={form.school_name || ''} onChange={(e) => set('school_name', e.target.value)} placeholder="e.g. Scholaria International" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Logo URL</Label>
              <Input value={form.logo || ''} onChange={(e) => set('logo', e.target.value)} placeholder="https://school.edu/logo.png" />
            </div>
          </FormSection>

          <FormSection title="Branding" columns={2}>
            <div className="space-y-1.5">
              <Label className="text-xs">Theme</Label>
              <select value={form.theme || 'light'} onChange={(e) => set('theme', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </FormSection>

          <FormSection title="Localization" columns={3}>
            <div className="space-y-1.5">
              <Label className="text-xs">Date Format</Label>
              <select value={form.date_format || ''} onChange={(e) => set('date_format', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {DATE_FORMATS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Timezone</Label>
              <select value={form.timezone || ''} onChange={(e) => set('timezone', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Language</Label>
              <select value={form.language || 'en'} onChange={(e) => set('language', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </FormSection>

          <FormSection title="Currency" columns={1}>
            <div className="space-y-1.5">
              <Label className="text-xs">Default Currency</Label>
              <select value={form.currency || 'USD'} onChange={(e) => set('currency', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </FormSection>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
