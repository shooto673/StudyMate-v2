// Referral code validation - first month only, one-time per email/device

const REFERRAL_KEY = 'sm_referral_data'

function getDeviceId() {
  let id = localStorage.getItem('sm_device_id')
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('sm_device_id', id)
  }
  return id
}

function loadReferralData() {
  try { return JSON.parse(localStorage.getItem(REFERRAL_KEY)) || null } catch { return null }
}

function saveReferralData(data) {
  localStorage.setItem(REFERRAL_KEY, JSON.stringify(data))
}

// Register a referral code (called at signup)
export function registerReferral(code, email) {
  if (!code || !email) return false
  const existing = loadReferralData()
  // Already used on this device
  if (existing && existing.used) return false
  saveReferralData({
    code: code.trim(),
    email: email.trim().toLowerCase(),
    deviceId: getDeviceId(),
    registeredAt: new Date().toISOString(),
    used: false, // becomes true after first plan upgrade
  })
  return true
}

// Check if referral discount is available (not expired, not used)
export function isReferralValid() {
  const data = loadReferralData()
  if (!data || !data.code || !data.registeredAt) return false
  // Already redeemed
  if (data.used) return false
  // Check 30-day expiry from registration
  const registeredAt = new Date(data.registeredAt)
  const now = new Date()
  const daysSince = (now - registeredAt) / (1000 * 60 * 60 * 24)
  if (daysSince > 30) return false
  return true
}

// Mark referral as used (called when user upgrades plan)
export function markReferralUsed() {
  const data = loadReferralData()
  if (!data) return
  data.used = true
  data.usedAt = new Date().toISOString()
  saveReferralData(data)
}

// Get referral info for display
export function getReferralInfo() {
  const data = loadReferralData()
  if (!data) return null
  const valid = isReferralValid()
  const registeredAt = new Date(data.registeredAt)
  const expiresAt = new Date(registeredAt.getTime() + 30 * 24 * 60 * 60 * 1000)
  const daysLeft = Math.max(0, Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)))
  return {
    code: data.code,
    email: data.email,
    valid,
    used: !!data.used,
    daysLeft,
  }
}

// Check if this device has already used a referral (prevents re-registering)
export function hasDeviceUsedReferral() {
  const data = loadReferralData()
  return !!(data && data.used)
}
