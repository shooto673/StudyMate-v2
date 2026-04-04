import { supabase } from './supabaseClient'

// Generate a short friend code from user ID (e.g., "SM-A3F2")
export function generateFriendCode(userId) {
  // Take first 4 chars of a hash of the userId, uppercase
  const hash = userId.replace(/-/g, '').slice(0, 4).toUpperCase()
  return `SM-${hash}`
}

// Sync local XP/level to Supabase profiles table
export async function syncProfile(userId, displayName, totalXp, level) {
  const friendCode = generateFriendCode(userId)
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    display_name: displayName,
    total_xp: totalXp,
    level: level,
    friend_code: friendCode,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (error) console.error('syncProfile error:', error)
  return friendCode
}

// Look up a user by friend code
export async function findUserByFriendCode(code) {
  const { data, error } = await supabase.from('profiles')
    .select('id, display_name, total_xp, level, friend_code')
    .eq('friend_code', code.toUpperCase().trim())
    .single()
  if (error) return null
  return data
}

// Add a friend (bidirectional)
export async function addFriend(userId, friendId) {
  // Insert both directions
  const { error } = await supabase.from('friendships').upsert([
    { user_id: userId, friend_id: friendId },
    { user_id: friendId, friend_id: userId },
  ], { onConflict: 'user_id,friend_id' })
  if (error) throw error
}

// Remove a friend (bidirectional)
export async function removeFriend(userId, friendId) {
  await supabase.from('friendships').delete().match({ user_id: userId, friend_id: friendId })
  await supabase.from('friendships').delete().match({ user_id: friendId, friend_id: userId })
}

// Get friends list with their profiles
export async function getFriends(userId) {
  const { data, error } = await supabase.from('friendships')
    .select('friend_id, profiles:friend_id(id, display_name, total_xp, level, friend_code)')
    .eq('user_id', userId)
  if (error) return []
  return (data || []).map(d => d.profiles).filter(Boolean)
}

// Get friend ranking (friends + self, sorted by XP)
export async function getFriendRanking(userId) {
  const friends = await getFriends(userId)
  // Also get self
  const { data: self } = await supabase.from('profiles')
    .select('id, display_name, total_xp, level')
    .eq('id', userId)
    .single()
  const all = self ? [self, ...friends] : friends
  return all.sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
}

// Get global ranking (top 50 by XP)
export async function getGlobalRanking() {
  const { data, error } = await supabase.from('profiles')
    .select('id, display_name, total_xp, level')
    .order('total_xp', { ascending: false })
    .limit(50)
  if (error) return []
  return data || []
}
