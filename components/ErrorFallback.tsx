import Link from 'next/link'

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

export default function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={resetError}
            className="py-3 px-6 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700"
          >
            Try Again
          </button>
          <Link 
            href="/" 
            className="py-3 px-6 rounded-lg font-semibold border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}