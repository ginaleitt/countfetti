'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import IconPicker from '@/components/IconPicker'
import type { Room } from '@/types/database'

export default function JoinRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const [room, setRoom] = useState<Room | null>(null)
  const [userName, setUserName] = useState('')
  const [userIcon, setUserIcon] = useState('👤')
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    fetchRoom()
  }, [id])

  const fetchRoom = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Room not found')
        } else {
          throw fetchError
        }
        return
      }

      setRoom(data)
    } catch (err) {
      console.error('Error fetching room:', err)
      setError('Failed to load room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsJoining(true)

    if (!userName.trim()) {
      setError('Please enter your name')
      setIsJoining(false)
      return
    }

    try {
      // Check if name already exists in room
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('name')
        .eq('room_id', id)
        .eq('name', userName.trim())
        .eq('is_active', true) // Only check active users

      if (checkError) throw checkError

      if (existingUsers && existingUsers.length > 0) {
        setError(`Name "${userName}" is already taken. Please take another."`)
        setIsJoining(false)
        return
      }

      // Create user in room
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          room_id: id,
          name: userName.trim(),
          icon: userIcon,
          is_active: true, 
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Store session token in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('countfetti_user', JSON.stringify({
          userId: newUser.id,
          sessionToken: newUser.session_token,
          roomId: id,
        }))
      }

      // Redirect to room
      router.push(`/room/${id}`)
      
    } catch (err) {
      console.error('Error joining room:', err)
      setError('Failed to join room. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-500 to-pink-500">
        <div className="text-white text-2xl font-semibold">Loading...</div>
      </main>
    )
  }

  if (error && !room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-500 to-pink-500 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
          <Link 
            href="/" 
            className="inline-block py-3 px-6 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        
        <h1 className="text-3xl font-bold text-purple-600 mb-2">Join Room</h1>
        {room && (
          <p className="text-gray-600 mb-6">
            <span className="font-semibold">{room.name}</span> - {room.subject}
          </p>
        )}
        
        <form onSubmit={handleJoin} className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border-2 text-gray-800 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              maxLength={20}
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pick Your Icon
            </label>
            <IconPicker 
              selectedIcon={userIcon} 
              onSelectIcon={setUserIcon}
            />
          </div>

          {/* Error Message */}
          {error && room && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isJoining}
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : '🎉 Join Room'}
          </button>
        </form>

        <Link 
          href="/" 
          className="block text-center mt-6 text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}