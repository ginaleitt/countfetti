'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Room } from '@/types/database'

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const { id } = use(params)
  
  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  
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
      
      await supabase
        .from('rooms')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', id)
        
    } catch (err) {
      console.error('Error fetching room:', err)
      setError('Failed to load room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleIncrement = async () => {
    if (!room) return

    const newCount = room.current_count + 1
    setRoom({ ...room, current_count: newCount })

    try {
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          current_count: newCount,
          last_activity: new Date().toISOString()
        })
        .eq('id', room.id)

      if (updateError) throw updateError

    } catch (err) {
      console.error('Error updating count:', err)
      setRoom({ ...room, current_count: room.current_count })
    }
  }

  const handleDecrement = async () => {
    if (!room) return
    if (room.direction === 'up') return

    const newCount = room.current_count - 1
    setRoom({ ...room, current_count: newCount })

    try {
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          current_count: newCount,
          last_activity: new Date().toISOString()
        })
        .eq('id', room.id)

      if (updateError) throw updateError

    } catch (err) {
      console.error('Error updating count:', err)
      setRoom({ ...room, current_count: room.current_count })
    }
  }

  const copyLinkToClipboard = async () => {
    const link = `${window.location.origin}/join/${id}`
    
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert(`Copy this link: ${link}`)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="text-white text-2xl font-semibold">Loading...</div>
      </main>
    )
  }

  if (error || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error || 'Room not found'}
          </h1>
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full">
        
        {/* Room Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">{room.name}</h1>
          <p className="text-gray-600 text-lg">
            Counting: <span className="font-semibold">{room.subject}</span>
          </p>
        </div>

        {/* Big Counter Display */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-12 mb-8 text-center">
          <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {room.current_count}
          </div>
        </div>

        {/* Counter Buttons */}
        <div className="flex gap-4 mb-8">
          {(room.direction === 'down' || room.direction === 'both') && (
            <button
              onClick={handleDecrement}
              className="flex-1 py-6 rounded-xl font-bold text-3xl bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all shadow-lg"
            >
              −
            </button>
          )}
          
          {(room.direction === 'up' || room.direction === 'both') && (
            <button
              onClick={handleIncrement}
              className="flex-1 py-6 rounded-xl font-bold text-3xl bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all shadow-lg"
            >
              +
            </button>
          )}
        </div>

        {/* Share Link Section */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Share this room:</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded border-2 border-purple-200 text-sm text-gray-700 overflow-x-auto">
              {typeof window !== 'undefined' && `${window.location.origin}/join/${id}`}
            </code>
            <button
              onClick={copyLinkToClipboard}
              className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <Link 
          href="/" 
          className="block text-center text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Leave Room
        </Link>
      </div>
    </main>
  )
}