export type Direction = 'up' | 'down' | 'both'

export interface Room {
  id: string
  name: string
  subject: string
  direction: Direction
  current_count: number
  created_at: string
  last_activity: string
  admin_id: string | null
}

export interface User {
  id: string
  room_id: string
  name: string
  icon: string
  joined_at: string
  session_token: string
}

export interface CountEvent {
  id: string
  room_id: string
  user_id: string
  change: number
  timestamp: string
}