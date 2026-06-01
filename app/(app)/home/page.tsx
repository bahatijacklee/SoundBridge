'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Music,
  CheckSquare,
  Users,
  TrendingUp,
  Heart,
  Star,
  ArrowRight,
  X,
  Zap,
  Award,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'

interface LevelProgress {
  current_level: string
  progress_percentage: number
  total_tasks_completed: number
  total_artists_engaged: number
}

interface Artist {
  id: string
  name: string
  image_url: string
  rating: number
  genre: string
}

interface UserData {
  total_earnings: number
  total_points: number
  is_vip: boolean
}

const LEVEL_CONFIG = {
  bronze: { reward: 5, color: 'from-amber-600 to-amber-700', next: 'silver', required_artists: 5 },
  silver: { reward: 15, color: 'from-slate-400 to-slate-500', next: 'gold', required_artists: 5 },
  gold: { reward: 50, color: 'from-yellow-400 to-yellow-500', next: 'platinum', required_artists: 7 },
  platinum: { reward: 150, color: 'from-slate-100 to-slate-300', next: null, required_artists: 10 },
}

export default function HomePage() {
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [trendingArtists, setTrendingArtists] = useState<Artist[]>([])
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [todayPoints, setTodayPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [dailyTasksCompleted, setDailyTasksCompleted] = useState(0)
  const supabase = createClient()

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) return

        // Fetch user data
        const { data: userProfiles } = await supabase
          .from('users')
          .select('total_earnings, total_points, is_vip')
          .eq('id', authUser.id)
          .single()

        if (userProfiles) {
          setUserData(userProfiles)
        }

        // Fetch today's earnings and task completion
        const todayDate = getTodayDate()
        const { data: todayTasks } = await supabase
          .from('user_tasks')
          .select('earned_amount, earned_points')
          .eq('user_id', authUser.id)
          .eq('completion_date', todayDate)

        if (todayTasks) {
          const totalEarnings = todayTasks.reduce((sum, task) => sum + (task.earned_amount || 0), 0)
          const totalPoints = todayTasks.reduce((sum, task) => sum + (task.earned_points || 0), 0)
          setTodayEarnings(totalEarnings)
          setTodayPoints(totalPoints)
          setDailyTasksCompleted(todayTasks.length)
        }

        // Fetch level progress
        const { data: levelData } = await supabase
          .from('level_progress')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        if (levelData) {
          setLevelProgress(levelData)
        }

        // Fetch trending artists (top 5 by rating)
        const { data: artists } = await supabase
          .from('artists')
          .select('*')
          .order('rating', { ascending: false })
          .limit(5)

        if (artists) {
          setTrendingArtists(artists)
        }
      } catch (error) {
        console.error('[v0] Error fetching home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const levelConfig = levelProgress ? LEVEL_CONFIG[levelProgress.current_level as keyof typeof LEVEL_CONFIG] : null
  const nextLevelConfig = levelConfig?.next ? LEVEL_CONFIG[levelConfig.next as keyof typeof LEVEL_CONFIG] : null

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Section */}
      <div className="premium-card bg-gradient-to-br from-slate-800 via-slate-750 to-slate-700 border-2 border-yellow-400 border-opacity-25 p-4 md:p-8 shadow-2xl shadow-yellow-400/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              Welcome back! 👋
            </h2>
            <p className="text-gray-300 text-base md:text-lg font-medium">
              Let&apos;s earn from music today
            </p>
          </div>
          <div className="text-right bg-gradient-to-br from-yellow-500 to-amber-600 bg-opacity-15 border-2 border-yellow-300 border-opacity-40 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
            <p className="text-xs md:text-sm text-yellow-100 mb-1.5 font-medium uppercase tracking-wide">Total Earnings</p>
            <p className="text-4xl md:text-5xl font-black text-yellow-300 drop-shadow-lg">
              ${userData?.total_earnings?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Link href="/artists">
          <div className="w-full h-20 md:h-24 bg-gradient-to-br from-slate-800 to-slate-700 border border-yellow-400 border-opacity-30 hover:border-yellow-400 hover:border-opacity-60 text-white justify-start p-3 md:p-4 rounded-xl flex flex-col items-start cursor-pointer transition-all hover:shadow-lg hover:shadow-yellow-400/10">
            <Music className="w-5 md:w-6 h-5 md:h-6 text-yellow-400 mb-1.5" />
            <span className="font-semibold text-white text-sm md:text-base">Explore Artists</span>
            <span className="text-xs text-gray-400">Discover & earn</span>
          </div>
        </Link>

        <Link href="/tasks">
          <div className="w-full h-20 md:h-24 bg-gradient-to-br from-slate-800 to-slate-700 border border-yellow-400 border-opacity-30 hover:border-yellow-400 hover:border-opacity-60 text-white justify-start p-3 md:p-4 rounded-xl flex flex-col items-start cursor-pointer transition-all hover:shadow-lg hover:shadow-yellow-400/10">
            <CheckSquare className="w-5 md:w-6 h-5 md:h-6 text-yellow-400 mb-1.5" />
            <span className="font-semibold text-white text-sm md:text-base">Start Tasks</span>
            <span className="text-xs text-gray-400">Complete & earn</span>
          </div>
        </Link>

        <div className="w-full h-20 md:h-24 bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 border border-yellow-500 border-opacity-40 text-slate-900 justify-start p-3 md:p-4 rounded-xl flex flex-col items-start cursor-pointer transition-all hover:shadow-lg hover:shadow-yellow-600/30">
          <Users className="w-5 md:w-6 h-5 md:h-6 mb-1.5 text-slate-900" />
          <span className="font-semibold text-slate-900 text-sm md:text-base">Invite Friends</span>
          <span className="text-xs opacity-90 text-slate-900">Earn together</span>
        </div>
      </div>

      {/* Daily Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="premium-card bg-gradient-to-br from-emerald-900 to-emerald-800 border-2 border-emerald-400 border-opacity-25 p-4 md:p-6 shadow-lg shadow-emerald-400/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-emerald-200 font-medium uppercase tracking-wide mb-1">
                Today's Earnings
              </p>
              <p className="text-3xl md:text-4xl font-bold text-emerald-400">
                ${todayEarnings.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 opacity-50" />
          </div>
        </div>

        <div className="premium-card bg-gradient-to-br from-purple-900 to-purple-800 border-2 border-purple-400 border-opacity-25 p-4 md:p-6 shadow-lg shadow-purple-400/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-purple-200 font-medium uppercase tracking-wide mb-1">
                Today's Points
              </p>
              <p className="text-3xl md:text-4xl font-bold text-purple-400">
                +{todayPoints}
              </p>
            </div>
            <Star className="w-6 h-6 md:w-8 md:h-8 text-purple-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Level Progress Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Your Levels</h3>
          <Link href="/account">
            <Button variant="ghost" className="text-yellow-400 hover:text-yellow-300 gap-2">
              View All Levels
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
            const isActive = levelProgress?.current_level === level
            const isCompleted = ['bronze', 'silver', 'gold', 'platinum'].indexOf(level) < ['bronze', 'silver', 'gold', 'platinum'].indexOf(levelProgress?.current_level || 'bronze')

            return (
              <div
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`border rounded-xl p-6 text-center transition-all cursor-pointer hover:shadow-lg ${
                  isActive
                    ? `border-yellow-400 border-opacity-50 bg-yellow-400 bg-opacity-5 hover:border-yellow-400 hover:border-opacity-70`
                    : isCompleted
                      ? 'border-green-500 border-opacity-30 bg-green-500 bg-opacity-5 hover:border-green-500 hover:border-opacity-50'
                      : 'border-gray-700 bg-slate-800 bg-opacity-50 hover:border-gray-600'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-gradient-to-br ${config.color}`}
                >
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-white capitalize mb-2">{level} Level</h4>
                <p className="text-2xl font-bold text-yellow-400 mb-2">${config.reward.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mb-3">
                  Like & Follow {config.required_artists} Artists
                </p>

                {isActive && (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${levelProgress?.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Progress: {levelProgress?.total_artists_engaged || 0}/{config.required_artists}
                    </p>
                  </div>
                )}

                {isCompleted && (
                  <p className="text-xs text-green-400 font-semibold">Unlocked ✓</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Trending Artists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Trending Artists</h3>
          <Link href="/artists">
            <Button variant="ghost" className="text-yellow-400 hover:text-yellow-300 gap-2">
              View All Artists
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {trendingArtists.map((artist) => (
            <div
              key={artist.id}
              className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer border border-purple-500 border-opacity-30"
            >
              {artist.image_url && (
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white text-sm">{artist.name}</h4>
                  <div className="flex items-center gap-1 bg-yellow-500 bg-opacity-30 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span className="text-xs font-bold text-yellow-300">
                      {artist.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-300 mb-3">{artist.genre}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-1 text-xs rounded-lg"
                  >
                    $5.00
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Task Highlights */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-yellow-400 border-opacity-20 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Daily Task Highlights</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-700 to-slate-600 border border-red-400 border-opacity-20 rounded-lg hover:border-red-400 hover:border-opacity-40 transition-all hover:shadow-lg hover:shadow-red-400/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-400 fill-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Like & Follow Artist</p>
                <p className="text-xs text-gray-400">Earn by liking & following 5 artists</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-yellow-400 text-lg">$5.00</p>
              <p className="text-xs text-gray-400">+50 PTS</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-700 to-slate-600 border border-green-400 border-opacity-20 rounded-lg hover:border-green-400 hover:border-opacity-40 transition-all hover:shadow-lg hover:shadow-green-400/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Rate Artist</p>
                <p className="text-xs text-gray-400">Rate 5 artists you love</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-yellow-400 text-lg">$4.00</p>
              <p className="text-xs text-gray-400">+40 PTS</p>
            </div>
          </div>
        </div>

        <Link href="/tasks">
          <button className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-bold py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-yellow-400/30">
            View All Tasks
          </button>
        </Link>
      </div>

      {/* Daily Progress */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-yellow-400 border-opacity-20 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Your Daily Progress</h3>
          <span className="text-yellow-400 font-bold bg-yellow-400 bg-opacity-10 px-3 py-1 rounded-full text-sm">+10 XP</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 border border-slate-600">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-4 rounded-full transition-all shadow-lg shadow-yellow-400/20"
            style={{ width: '30%' }}
          ></div>
        </div>
        <p className="text-sm text-gray-300 mt-3 font-medium">You completed {dailyTasksCompleted}/10 tasks today</p>
      </div>

      {/* Level Details Modal */}
      {selectedLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-yellow-400 border-opacity-30 rounded-xl shadow-2xl max-w-md w-full my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-yellow-400 border-opacity-20 px-4 md:px-6 py-4 md:py-6 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg md:text-xl font-bold text-white capitalize">{selectedLevel} Level Details</h3>
              <button
                onClick={() => setSelectedLevel(null)}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-4"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 space-y-4">
              {selectedLevel === 'bronze' ? (
                // Bronze Level: Show Metrics
                <>
                  <div className="space-y-4">
                    {/* Total Points */}
                    <div className="bg-slate-800 bg-opacity-50 border border-purple-500 border-opacity-30 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500 bg-opacity-10 rounded-lg">
                          <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-gray-400 text-sm font-medium">Total Points</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-400 ml-11">
                        {userData?.total_points || 0}
                      </p>
                    </div>

                    {/* Amount Accumulated */}
                    <div className="bg-slate-800 bg-opacity-50 border border-yellow-500 border-opacity-30 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500 bg-opacity-10 rounded-lg">
                          <Award className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-gray-400 text-sm font-medium">Amount Accumulated</span>
                      </div>
                      <p className="text-3xl font-bold text-yellow-400 ml-11">
                        ${userData?.total_earnings?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    {/* Daily Tasks Completed */}
                    <div className="bg-slate-800 bg-opacity-50 border border-emerald-500 border-opacity-30 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500 bg-opacity-10 rounded-lg">
                          <Calendar className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-gray-400 text-sm font-medium">Daily Tasks Completed</span>
                      </div>
                      <p className="text-3xl font-bold text-emerald-400 ml-11">
                        {dailyTasksCompleted}/3
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <p className="text-xs text-gray-500 text-center">
                      Keep completing tasks to progress to the next level!
                    </p>
                    <button
                      onClick={() => setSelectedLevel(null)}
                      className="w-full border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 font-semibold py-2 rounded-lg transition-all md:hidden"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                // Premium Levels: Show Subscription Prompt
                <>
                  <div className="bg-gradient-to-br from-amber-500 from-opacity-10 to-yellow-500 to-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                      <Star className="w-6 h-6 text-yellow-400" />
                    </div>
                    <h4 className="font-bold text-white text-lg">Premium Level</h4>
                    <p className="text-sm text-gray-300">
                      This level is available exclusively to VIP members. Upgrade now to unlock premium tasks and earn higher rewards!
                    </p>
                  </div>

                  <Link href="/account">
                    <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-bold py-2 rounded-lg transition-all">
                      Upgrade to VIP
                    </Button>
                  </Link>

                  <button
                    onClick={() => setSelectedLevel(null)}
                    className="w-full border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 font-semibold py-2 rounded-lg transition-all"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
