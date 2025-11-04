'use client'

import { use } from 'react'
import Link from 'next/link'

export default function JoinRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-purple-600 mb-4">Join Room</h1>
        <p className="text-gray-600 mb-4">Room ID: {id}</p>
        <p className="text-gray-600 mb-6">Join form will go here</p>
        
        <Link 
          href="/" 
          className="text-purple-600 hover:text-purple-700 underline"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}