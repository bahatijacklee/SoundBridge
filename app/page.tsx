import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Headphones, Music, Zap, Users, Trophy, Gift } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 md:px-12 py-4 md:py-6">
        <div className="flex items-center gap-2">
          <Headphones className="w-6 md:w-8 h-6 md:h-8 text-yellow-400" />
          <span className="text-lg md:text-2xl font-bold text-white">SoundBridge</span>
        </div>
        <div className="flex gap-2 md:gap-4">
          <Link href="/admin">
            <Button variant="ghost" className="text-gray-300 hover:text-white text-xs md:text-base">
              Staff Login
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white text-xs md:text-base">
              Log In
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold hover:from-yellow-300 hover:to-yellow-400 text-xs md:text-base">
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 md:px-12 py-12 md:py-32 text-center">
        <h1 className="text-3xl md:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
          Connecting Sound.{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
            Creating Opportunity.
          </span>
        </h1>
        <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
          SoundBridge is the platform where fans earn real rewards by supporting their favorite artists. Complete simple tasks, climb the levels, and unlock exclusive benefits.
        </p>
        <div className="flex gap-3 md:gap-4 justify-center flex-wrap">
          <Link href="/auth/sign-up">
            <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold hover:from-yellow-300 hover:to-yellow-400 text-sm md:text-base">
              Get Started
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-slate-800 text-sm md:text-base">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
          {[
            { icon: Music, title: '25M+ Streams', desc: 'Support artists daily' },
            { icon: Users, title: '150K+ Users', desc: 'Growing community' },
            { icon: Gift, title: '$2M+ Rewards', desc: 'Distributed to fans' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 bg-opacity-20 rounded-full flex items-center justify-center border border-yellow-400 border-opacity-50">
                <item.icon className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="font-bold text-white">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="relative z-10 px-4 md:px-12 py-12 md:py-32 border-t border-gray-800"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-8 md:mb-16">
          How It Works
        </h2>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { num: '1', title: 'Create Account', desc: 'Sign up and join the community' },
            { num: '2', title: 'Explore Artists', desc: 'Discover your favorite artists' },
            { num: '3', title: 'Complete Tasks', desc: 'Follow, like, share and earn points' },
            { num: '4', title: 'Earn Rewards', desc: 'Cash out your rewards anytime' },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-900">{step.num}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 md:px-12 py-20 md:py-32 border-t border-gray-800">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Why Choose SoundBridge
        </h2>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: Trophy,
              title: 'Level Up System',
              desc: 'Progress from Bronze to Platinum levels and unlock exclusive rewards',
            },
            {
              icon: Zap,
              title: 'Instant Rewards',
              desc: 'Earn real USD and cryptocurrency for completing tasks',
            },
            {
              icon: Users,
              title: 'Community Driven',
              desc: 'Join thousands of fans supporting their favorite artists',
            },
            {
              icon: Gift,
              title: 'VIP Benefits',
              desc: 'Unlock premium rewards and priority support',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 border border-gray-800 rounded-xl hover:border-yellow-400 hover:border-opacity-50 transition-all"
            >
              <feature.icon className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20 md:py-32 border-t border-gray-800 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Start Earning?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of music fans earning rewards on SoundBridge today.
        </p>
        <Link href="/auth/sign-up">
          <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold hover:from-yellow-300 hover:to-yellow-400">
            Create Your Free Account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 px-6 md:px-12 py-12 text-center text-gray-500">
        <p className="mb-4">© 2024 SoundBridge Inc. All rights reserved.</p>
        <div className="flex gap-6 justify-center text-sm">
          <a href="#" className="hover:text-gray-300">
            About Us
          </a>
          <a href="#" className="hover:text-gray-300">
            Contact
          </a>
          <a href="#" className="hover:text-gray-300">
            Terms of Service
          </a>
          <a href="#" className="hover:text-gray-300">
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  )
}
