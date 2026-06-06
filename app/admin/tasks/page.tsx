'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ListTodo, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Task {
  id: string
  artist_id: string | null
  task_type: string
  title: string
  description: string
  reward_amount: number
  reward_points: number
  required_level: string | null
  created_at: string
}

interface ArtistOption {
  id: string
  name: string
}

type TaskFormState = {
  title: string
  description: string
  task_type: string
  reward_amount: string
  reward_points: string
  required_level: string
  artist_id: string
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [form, setForm] = useState<TaskFormState>({
    title: '',
    description: '',
    task_type: 'engagement',
    reward_amount: '',
    reward_points: '',
    required_level: '',
    artist_id: '',
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tasksRes, artistsRes] = await Promise.all([
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('artists').select('id, name').order('name', { ascending: true }),
        ])

        if (tasksRes.error) throw tasksRes.error
        if (artistsRes.error) throw artistsRes.error

        setTasks((tasksRes.data as Task[]) || [])
        setArtists((artistsRes.data as ArtistOption[]) || [])
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [])

  const refreshTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    setTasks((data as Task[]) || [])
  }

  const openAddModal = () => {
    setSelectedTask(null)
    setForm({
      title: '',
      description: '',
      task_type: 'engagement',
      reward_amount: '',
      reward_points: '',
      required_level: '',
      artist_id: '',
    })
    setModalMode('add')
  }

  const openEditModal = (task: Task) => {
    setSelectedTask(task)
    setForm({
      title: task.title ?? '',
      description: task.description ?? '',
      task_type: task.task_type ?? 'engagement',
      reward_amount: Number.isFinite(task.reward_amount) ? String(task.reward_amount) : '',
      reward_points: Number.isFinite(task.reward_points) ? String(task.reward_points) : '',
      required_level: task.required_level ?? '',
      artist_id: task.artist_id ?? '',
    })
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedTask(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const title = form.title.trim()
      const taskType = form.task_type.trim()
      const rewardAmount = Number(form.reward_amount)
      const rewardPoints = Number(form.reward_points)

      if (!title) throw new Error('Title is required')
      if (!taskType) throw new Error('Task type is required')
      if (!Number.isFinite(rewardAmount)) throw new Error('Invalid reward amount')
      if (!Number.isFinite(rewardPoints)) throw new Error('Invalid reward points')

      const payload: Partial<Task> = {
        title,
        task_type: taskType,
        description: form.description.trim() ? form.description.trim() : '',
        reward_amount: rewardAmount,
        reward_points: rewardPoints,
        required_level: form.required_level.trim() ? form.required_level.trim() : null,
        artist_id: form.artist_id ? form.artist_id : null,
      }

      if (modalMode === 'add') {
        const { error } = await supabase.from('tasks').insert([payload])
        if (error) throw error
      }

      if (modalMode === 'edit' && selectedTask) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', selectedTask.id)
        if (error) throw error
      }

      await refreshTasks()
      closeModal()
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

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
        <Button onClick={openAddModal} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
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
            <Button onClick={openAddModal} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
              <Plus className="w-4 h-4" />
              Create First Task
            </Button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => openEditModal(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openEditModal(task)
              }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
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

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {modalMode === 'add' ? 'Add New Task' : 'Edit Task'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
                <input
                  type="text"
                  required
                  value={form.task_type}
                  onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. engagement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  placeholder="Task description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reward Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.reward_amount}
                    onChange={(e) => setForm({ ...form, reward_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reward Points</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.reward_points}
                    onChange={(e) => setForm({ ...form, reward_points: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required Level</label>
                  <input
                    type="text"
                    value={form.required_level}
                    onChange={(e) => setForm({ ...form, required_level: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g. bronze"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Artist (optional)</label>
                  <select
                    value={form.artist_id}
                    onChange={(e) => setForm({ ...form, artist_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">No artist</option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                  {modalMode === 'add' ? 'Add Task' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
