'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function CreateRoom() {
  const [roomName, setRoomName] = useState('')
  const [subject, setSubject] = useState('')
  const [direction, setDirection] = useState('up')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!roomName.trim() || !subject.trim()) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: insertError } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          subject: subject,
          direction: direction,
          current_count: direction === 'down' ? 100 : 0,
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/room/${data.id}`)
      
    } catch (err) {
      console.error('Error creating room:', err)
      setError('Failed to create room. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Create New Room</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Dave's Beer Counter"
              className="w-full px-4 py-3 border-2 text-gray-800 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Subject Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What are you counting?
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Times Dave said 'literally'"
              className="w-full px-4 py-3 border-2 text-gray-800 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Direction Radio Buttons */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Counting Direction
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="up"
                  checked={direction === 'up'}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-700">📈 Count Up (0, 1, 2...)</span>
              </label>
              
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="down"
                  checked={direction === 'down'}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-700">📉 Count Down (100, 99, 98...)</span>
              </label>
              
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="both"
                  checked={direction === 'both'}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-700">↕️ Both (+/-)</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : '🎉 Create Room'}
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