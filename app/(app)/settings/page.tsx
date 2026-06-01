'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bell,
  Lock,
  Globe,
  LogOut,
  ChevronRight,
  Save,
} from 'lucide-react'

interface UserData {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  avatar_url: string | null
  bio: string | null
}

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) return

        // Fetch user data
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (user) {
          setUserData(user)
          setUsername(user.username)
          setFirstName(user.first_name || '')
          setLastName(user.last_name || '')
          setPhoneNumber(user.phone_number || '')
          setBio(user.bio || '')
          setEmail(authUser.email || '')
        }
      } catch (error) {
        console.error('[v0] Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleSaveProfile = async () => {
    if (!userData) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          bio,
        })
        .eq('id', userData.id)

      if (!error) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('[v0] Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Profile Settings */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Profile Settings
          </h2>
          <p className="text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        <div className="bg-slate-800 border border-gray-700 rounded-xl p-8 space-y-6">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-gray-300 text-sm">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-gray-300 text-sm">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username" className="text-gray-300 text-sm">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              disabled
              className="mt-2 bg-slate-700 border-gray-600 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">
              Auto-generated from first and last name
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phoneNumber" className="text-gray-300 text-sm">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <Label htmlFor="email" className="text-gray-300 text-sm">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="mt-2 bg-slate-700 border-gray-600 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">
              Email cannot be changed
            </p>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-gray-300 text-sm">
              Bio
            </Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="mt-2 w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:border-yellow-400 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Save Button */}
          {saveSuccess && (
            <div className="p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
              <p className="text-sm text-green-400">
                Profile saved successfully!
              </p>
            </div>
          )}

          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 rounded-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Preferences</h2>
          <p className="text-gray-400">
            Customize your SoundBridge experience
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              icon: Bell,
              title: 'Notifications',
              description: 'Manage notification settings',
            },
            {
              icon: Globe,
              title: 'Language & Region',
              description: 'Choose your preferred language',
            },
            {
              icon: Lock,
              title: 'Privacy',
              description: 'Control who can see your profile',
            },
          ].map((item) => (
            <button
              key={item.title}
              className="w-full p-4 bg-slate-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-lg text-yellow-400 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Security</h2>
          <p className="text-gray-400">Keep your account safe and secure</p>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-slate-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg text-blue-400 group-hover:bg-opacity-30 transition-all">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Change Password</p>
                <p className="text-sm text-gray-400">
                  Update your password regularly
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-all" />
          </div>

          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="space-y-4 pt-8 border-t border-gray-800">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Danger Zone</h3>
          <p className="text-gray-400 text-sm">
            Irreversible and destructive actions
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full border-red-500 border-opacity-30 text-red-400 hover:bg-red-500 hover:bg-opacity-10 font-bold py-3 rounded-lg"
        >
          Delete My Account
        </Button>
      </div>
    </div>
  )
}
