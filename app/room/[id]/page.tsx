'use client'

import { use, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Room } from '@/types/database'
import RateLimiter from '@/lib/rateLimit'

interface Participant {
  id: string
  room_id: string
  name: string
  icon: string
  joined_at: string
  session_token: string
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isInitialMount = useRef(true)
  
  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentUser, setCurrentUser] = useState<Participant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showJoinPrompt, setShowJoinPrompt] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  
  const router = useRouter()
  const rateLimiterRef = useRef(new RateLimiter(10, 1000)) // 10 clicks per second

  // Helper functions for presence tracking
  const markUserActive = async () => {
    if (!currentUser?.id) {
      console.log('⚠️ markUserActive: No currentUser.id, skipping')
      return
    }
    
    console.log('✅ markUserActive: Marking user active:', currentUser.id)
    
    try {
      await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', currentUser.id)
      console.log('✅ markUserActive: Success')
    } catch (err) {
      console.error('❌ markUserActive: Error:', err)
    }
  }

  const markUserInactive = async () => {
    if (!currentUser?.id) {
      console.log('⚠️ markUserInactive: No currentUser.id, skipping')
      return
    }
    
    console.log('🔴 markUserInactive: Marking user inactive:', currentUser.id)
    
    try {
      await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', currentUser.id)
      console.log('🔴 markUserInactive: Success')
    } catch (err) {
      console.error('❌ markUserInactive: Error:', err)
    }
  }

  // Fetch room data on mount
  useEffect(() => {
    console.log('🏠 Room page mounted, fetching room:', id)
    fetchRoom()
  }, [id])

  // Fetch participants on mount
  useEffect(() => {
    if (!id) return
    console.log('👥 Fetching participants for room:', id)
    fetchParticipants()
  }, [id])

  // Check for existing session
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    console.log('🔐 Checking for existing session in localStorage')
    const storedUser = localStorage.getItem('countfetti_user')
    if (!storedUser) {
      console.log('🔐 No stored user found')
      return
    }

    try {
      const userData = JSON.parse(storedUser)
      console.log('🔐 Found stored user:', userData)
      
      // Check if this user belongs to this room
      if (userData.roomId === id) {
        console.log('🔐 User belongs to this room, verifying session')
        verifySession(userData.userId, userData.sessionToken)
      } else {
        console.log('🔐 User belongs to different room, skipping')
      }
    } catch (err) {
      console.error('❌ Error parsing stored user:', err)
      localStorage.removeItem('countfetti_user')
    }
  }, [id])

  // Update the presence tracking useEffect
useEffect(() => {
  if (!currentUser?.id) {
    console.log('👋 Presence tracking: No currentUser, skipping')
    return
  }
  
  console.log('👋 Presence tracking: Starting for user:', currentUser.id, currentUser.name)
  
  // Mark user as active when they enter the room
  markUserActive()
  
  // Skip cleanup on initial mount (React Strict Mode double mount)
  if (isInitialMount.current) {
    isInitialMount.current = false
    console.log('⚠️ Initial mount, skipping cleanup setup')
    return
  }
  
  // Handle tab close/browser close
  const handleBeforeUnload = () => {
    console.log('🚪 beforeunload: Tab closing, marking inactive')
    markUserInactive()
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // Cleanup: mark inactive when leaving room
  return () => {
    console.log('🧹 Presence tracking cleanup: Removing listener and marking inactive')
    window.removeEventListener('beforeunload', handleBeforeUnload)
    markUserInactive()
  }
}, [currentUser?.id])

  
// Show join prompt if user is not a member after loading
useEffect(() => {
  console.log('🎯 Join prompt check:', { 
    isLoading, 
    hasRoom: !!room, 
    hasCurrentUser: !!currentUser,
    participantCount: participants.length 
  })
  
  if (!isLoading && room && !currentUser) {
    console.log('🎯 Setting showJoinPrompt to TRUE')
    setShowJoinPrompt(true)
  } else if (!isLoading && currentUser) {
    // ADDED: Explicitly set to false when user is identified
    console.log('🎯 Setting showJoinPrompt to FALSE')
    setShowJoinPrompt(false)
  } else {
    console.log('🎯 showJoinPrompt unchanged')
  }
}, [isLoading, room, currentUser, participants])

  // Real-time subscription for counter updates
  useEffect(() => {
    if (!id) return

    console.log('📡 Setting up real-time counter subscription for room:', id)

    const channel = supabase
      .channel(`room:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('📡 Real-time counter update:', payload)
          setRoom(payload.new as Room)
          // Trigger animation for remote updates
          setIsAnimating(true)
          setTimeout(() => setIsAnimating(false), 300)
        }
      )
      .subscribe()

    return () => {
      console.log('📡 Cleaning up counter subscription')
      supabase.removeChannel(channel)
    }
  }, [id])

  // Real-time subscription for participants
  useEffect(() => {
    if (!id) return

    console.log('📡 Setting up real-time participants subscription for room:', id)

    const channel = supabase
      .channel(`users:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `room_id=eq.${id}`,
        },
        () => {
          console.log('📡 Real-time participant update, refetching participants')
          fetchParticipants() // This already filters by is_active
        }
      )
      .subscribe()

    return () => {
      console.log('📡 Cleaning up participants subscription')
      supabase.removeChannel(channel)
    }
  }, [id])

  const fetchRoom = async () => {
    try {
      console.log('🏠 Fetching room data...')
      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('❌ Room not found')
          setError('Room not found')
        } else {
          throw fetchError
        }
        return
      }

      console.log('🏠 Room fetched successfully:', data)
      setRoom(data)
      
      await supabase
        .from('rooms')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', id)
        
    } catch (err) {
      console.error('❌ Error fetching room:', err)
      setError('Failed to load room')
    } finally {
      setIsLoading(false)
      console.log('🏠 Room loading complete, isLoading set to false')
    }
  }

  const fetchParticipants = async () => {
    try {
      console.log('👥 Fetching participants...')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('room_id', id)
        .eq('is_active', true) // Only show active users
        .order('joined_at', { ascending: true })

      if (error) throw error
      console.log('👥 Participants fetched:', data)
      setParticipants(data || [])
    } catch (err) {
      console.error('❌ Error fetching participants:', err)
    }
  }

  const verifySession = async (userId: string, sessionToken: string) => {
    try {
      console.log('🔍 Verifying session for userId:', userId)
      
      const { data: initialData, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('session_token', sessionToken)
        .single()

      console.log('🔍 Initial data fetched:', initialData)

      if (checkError || !initialData) {
        console.log('❌ Session invalid, clearing localStorage')
        localStorage.removeItem('countfetti_user')
        return
      }

      // Mark user as active
      console.log('🔄 Updating user to is_active: true')
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', userId)

      if (updateError) {
        console.log('❌ Error updating is_active:', updateError)
        throw updateError
      }
      
      console.log('✅ User marked as active')

      // Refetch to get updated data
      console.log('🔄 Refetching user data...')
      const { data: updatedData, error: refetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('🔍 Refetched data:', updatedData)

      if (refetchError || !updatedData) {
        console.log('❌ Refetch failed, clearing localStorage')
        localStorage.removeItem('countfetti_user')
        return
      }

      console.log('✅ Setting currentUser:', updatedData)
      setCurrentUser(updatedData)
      
    } catch (err) {
      console.error('❌ Error verifying session:', err)
    }
  }

  const handleIncrement = async () => {
    if (!room) return

    // Check rate limit
    if (!rateLimiterRef.current.canClick()) {
      setIsRateLimited(true)
      const remainingTime = rateLimiterRef.current.getRemainingTime()
      setTimeout(() => setIsRateLimited(false), remainingTime)
      return
    }

    const newCount = room.current_count + 1
    setRoom({ ...room, current_count: newCount })
    
    // Trigger animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    try {
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          current_count: newCount,
          last_activity: new Date().toISOString()
        })
        .eq('id', room.id)

      if (updateError) throw updateError

      // Record count event (optional)
      if (currentUser) {
        await supabase
          .from('count_events')
          .insert({
            room_id: room.id,
            user_id: currentUser.id,
            change: 1,
          })
      }

    } catch (err) {
      console.error('Error updating count:', err)
      setRoom({ ...room, current_count: room.current_count })
    }
  }

  const handleDecrement = async () => {
    if (!room) return
    if (room.direction === 'up') return

    // Check rate limit
    if (!rateLimiterRef.current.canClick()) {
      setIsRateLimited(true)
      const remainingTime = rateLimiterRef.current.getRemainingTime()
      setTimeout(() => setIsRateLimited(false), remainingTime)
      return
    }

    const newCount = room.current_count - 1
    setRoom({ ...room, current_count: newCount })
    
    // Trigger animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    try {
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          current_count: newCount,
          last_activity: new Date().toISOString()
        })
        .eq('id', room.id)

      if (updateError) throw updateError

      // Record count event (optional)
      if (currentUser) {
        await supabase
          .from('count_events')
          .insert({
            room_id: room.id,
            user_id: currentUser.id,
            change: -1,
          })
      }

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

  const handleLeaveRoom = async () => {
    console.log('👋 User leaving room')
    if (currentUser) {
      // Mark user as inactive (not deleted!)
      await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', currentUser.id)
    }
    
    // Clear localStorage
    localStorage.removeItem('countfetti_user')
    
    // Go home
    router.push('/')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-500 to-pink-500">
        <div className="text-white text-2xl font-semibold">Loading...</div>
      </main>
    )
  }

  if (error || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-500 to-pink-500 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
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

  // If user should join, show prompt
  if (showJoinPrompt) {
    console.log('🎯 Rendering join prompt screen')
    return (
      <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-500 to-pink-500 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-purple-600 mb-4">
            {room.name}
          </h1>
          <p className="text-gray-600 mb-6">
            This room is active! Join to start counting.
          </p>
          <Link 
            href={`/join/${id}`}
            className="inline-block w-full py-4 px-6 rounded-lg font-semibold text-lg bg-purple-600 text-white hover:bg-purple-700 transition-all"
          >
            🎉 Join Room
          </Link>
          <Link 
            href="/" 
            className="block mt-4 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    )
  }

  console.log('🎯 Rendering main room screen')
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full">
        
        {/* Room Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">{room.name}</h1>
          <p className="text-gray-600 text-lg">
            Counting: <span className="font-semibold">{room.subject}</span>
          </p>
        </div>

        {/* Big Counter Display - Responsive with Animation */}
        <div className={`bg-linear-to-br from-purple-100 to-pink-100 rounded-2xl p-8 sm:p-12 mb-8 text-center transition-all duration-300 ${
          isAnimating ? 'scale-110 shadow-2xl' : ''
        }`}>
          <div className="text-6xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {room.current_count}
          </div>
        </div>

        {/* Counter Buttons - Better touch targets on mobile */}
        <div className="flex gap-4 mb-8">
          {(room.direction === 'down' || room.direction === 'both') && (
            <button
              onClick={handleDecrement}
              disabled={isRateLimited}
              className="flex-1 py-8 sm:py-6 rounded-xl font-bold text-4xl sm:text-3xl bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all shadow-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
          )}
          
          {(room.direction === 'up' || room.direction === 'both') && (
            <button
              onClick={handleIncrement}
              disabled={isRateLimited}
              className="flex-1 py-8 sm:py-6 rounded-xl font-bold text-4xl sm:text-3xl bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all shadow-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          )}
        </div>

        {/* Rate Limit Warning */}
        {isRateLimited && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mb-6 text-center">
            <p className="text-yellow-800 text-sm font-semibold">
              ⚠️ Whoa there! Slow down a bit...
            </p>
          </div>
        )}

        {/* Participants List */}
        {participants.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              In this room ({participants.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 ${
                    currentUser?.id === participant.id
                      ? 'bg-purple-100 border-purple-400'
                      : 'bg-white border-purple-200'
                  }`}
                >
                  <span className="text-xl">{participant.icon}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {participant.name}
                    {currentUser?.id === participant.id && (
                      <span className="ml-1 text-xs text-purple-600 font-bold">(You)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Link Section - Mobile friendly */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Share this room:</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded border-2 border-purple-200 text-xs sm:text-sm text-gray-700 overflow-x-auto">
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

        <button
          onClick={handleLeaveRoom}
          className="block w-full text-center py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
        >
          👋 Leave Room
        </button>
      </div>
    </main>
  )
}