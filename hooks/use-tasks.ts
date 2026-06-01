'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Task {
  id: string
  artist_id: string
  task_type: 'follow' | 'like' | 'read_bio' | 'buy_card'
  title: string
  description: string
  reward_amount: number
  reward_points: number
  required_level: string | null
  created_at: string
}

interface CompletedTask {
  id: string
  user_id: string
  task_id: string
  completed_at: string
  earned_amount: number
  earned_points: number
}

export function useTasks(userId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      const supabase = createClient()

      // Fetch all tasks
      const { data, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (tasksError) {
        setError(tasksError)
        return
      }

      setTasks(data || [])

      // Fetch completed tasks if userId provided
      if (userId) {
        const { data: completed, error: completedError } = await supabase
          .from('user_tasks')
          .select('*')
          .eq('user_id', userId)

        if (completedError) {
          console.error('Error fetching completed tasks:', completedError)
        } else {
          setCompletedTasks(completed || [])
        }
      }

      setLoading(false)
    }

    fetchTasks()
  }, [userId])

  const completeTask = async (taskId: string, userId: string) => {
    const supabase = createClient()

    // Find the task to get reward amounts
    const task = tasks.find((t) => t.id === taskId)
    if (!task) throw new Error('Task not found')

    // Insert completed task
    const { error: insertError } = await supabase
      .from('user_tasks')
      .insert({
        user_id: userId,
        task_id: taskId,
        earned_amount: task.reward_amount,
        earned_points: task.reward_points,
      })

    if (insertError) {
      setError(insertError)
      throw insertError
    }

    // Update user earnings
    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_earnings: 0, // Will be calculated on fetch
        total_points: 0, // Will be calculated on fetch
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError)
      throw updateError
    }

    // Refresh completed tasks
    const { data: updated } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', userId)

    setCompletedTasks(updated || [])
  }

  return {
    tasks,
    completedTasks,
    loading,
    error,
    completeTask,
  }
}
