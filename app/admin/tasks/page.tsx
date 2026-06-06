'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ListTodo, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Task {
  id: string
  title: string
  description: string
  reward_amount: number
  reward_points: number
  created_at: string
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setTasks(data || [])
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 mt-1">Manage all tasks on the platform</p>
        </div>
        <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks yet</h3>
            <p className="text-slate-500 mb-6">Create tasks for users to complete and earn rewards</p>
            <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
              <Plus className="w-4 h-4" />
              Create First Task
            </Button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{task.title}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description}</p>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-yellow-600">
                    ${Number(task.reward_amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-600">{task.reward_points} pts</p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(task.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
