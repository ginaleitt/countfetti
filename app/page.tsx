import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        
        {/* Hero section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            CountFetti 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Real-time collaborative counting for game nights, parties, and fun!
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 mb-8">
          <Link 
            href="/create" 
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg text-center"
          >
            Create Room
          </Link>
          
          <Link 
            href="/join" 
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all border-2 border-purple-600 text-purple-600 hover:bg-purple-50 text-center"
          >
            Join Room
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="text-center space-y-2 text-sm text-gray-500">
          <p>✨ No signup required</p>
          <p>⚡ Updates in real-time</p>
          <p>🎯 Perfect for tracking anything</p>
        </div>
      </div>
    </main>
  )
}