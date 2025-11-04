// Simple client-side rate limiter
class RateLimiter {
  private clicks: number[] = []
  private maxClicks: number
  private timeWindow: number // in milliseconds

  constructor(maxClicks: number = 10, timeWindow: number = 1000) {
    this.maxClicks = maxClicks
    this.timeWindow = timeWindow
  }

  canClick(): boolean {
    const now = Date.now()
    
    // Remove clicks outside the time window
    this.clicks = this.clicks.filter(clickTime => now - clickTime < this.timeWindow)
    
    // Check if under limit
    if (this.clicks.length >= this.maxClicks) {
      return false
    }
    
    // Record this click
    this.clicks.push(now)
    return true
  }

  getRemainingTime(): number {
    if (this.clicks.length < this.maxClicks) return 0
    
    const oldestClick = this.clicks[0]
    const timeElapsed = Date.now() - oldestClick
    return Math.max(0, this.timeWindow - timeElapsed)
  }
}

export default RateLimiter