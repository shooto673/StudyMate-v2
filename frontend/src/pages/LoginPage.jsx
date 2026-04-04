import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage({ onNavigate, onEmailLogin, onEmailSignUp, onGoogleLogin, authError }) {
  const [tab, setTab] = useState('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [showReferral, setShowReferral] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegister = async () => {
    setError(''); setSuccess('')
    if (!displayName.trim()) return setError('ニックネームを入力してね')
    if (!email.trim()) return setError('メールアドレスを入力してね')
    if (password.length < 6) return setError('パスワードは6文字以上にしてね')
    if (password !== passwordConfirm) return setError('パスワードが一致しないよ')
    setIsSubmitting(true)
    try {
      await onEmailSignUp(email, password, displayName, referralCode.trim())
      // Navigation is handled by App.jsx after auth state changes
    } catch (e) {
      const msg = e.message || '登録に失敗しました'
      setError(msg.includes('already registered') ? 'このメールアドレスは既に登録されています' : msg)
    } finally { setIsSubmitting(false) }
  }

  const handleLogin = async () => {
    setError(''); setSuccess('')
    if (!email.trim() || !password.trim()) return setError('メールアドレスとパスワードを入力してね')
    setIsSubmitting(true)
    try {
      await onEmailLogin(email, password)
      // Navigation is handled by App.jsx after auth state changes
    } catch (e) {
      const msg = e.message || 'ログインに失敗しました'
      setError(msg.includes('Invalid login') ? 'メールアドレスまたはパスワードが正しくありません' : msg)
    } finally { setIsSubmitting(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') tab === 'register' ? handleRegister() : handleLogin()
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px 14px 48px', borderRadius: 14,
    border: '2px solid #e5e7eb', fontSize: 15, outline: 'none',
    background: '#fff', transition: 'border-color 0.2s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const inputFocusStyle = '2px solid #6C63FF'
  const iconWrap = { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFDF7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}
      >
        {/* Mascot */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <motion.img
            src="/mascots/taylor/mascot-normal.png" alt="テイラーくん"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
          />
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            style={{ display: 'inline-block', borderRadius: 16, background: '#fff', padding: '8px 20px', fontSize: 14, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: -8, position: 'relative', zIndex: 1 }}>
            {tab === 'register' ? 'ようこそ！一緒に冒険しよう！' : 'おかえり！'}
          </motion.div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.06)', border: '1px solid #f1f1f1' }}>
          <h1 className="font-black" style={{ fontSize: 22, textAlign: 'center', marginBottom: 20, color: '#1a1a2e' }}>
            {tab === 'register' ? 'アカウントを作成' : 'ログイン'}
          </h1>

          {/* Tabs */}
          <div style={{ display: 'flex', borderRadius: 12, background: '#f3f4f6', padding: 4, marginBottom: 24 }}>
            {[{ id: 'login', label: 'ログイン' }, { id: 'register', label: 'アカウント作成' }].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === t.id ? '#fff' : 'transparent',
                  color: tab === t.id ? '#6C63FF' : '#9ca3af',
                  boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: '12px 16px', borderRadius: 12, background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: '12px 16px', borderRadius: 12, background: '#EBFBEE', color: '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onKeyDown={handleKeyDown}>
            {tab === 'register' && (
              <div style={{ position: 'relative' }}>
                <div style={iconWrap}><User size={18} /></div>
                <input type="text" placeholder="ニックネーム" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  style={inputStyle} onFocus={e => e.target.style.borderColor = '#6C63FF'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <div style={iconWrap}><Mail size={18} /></div>
              <input type="email" placeholder="メールアドレス" value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} onFocus={e => e.target.style.borderColor = '#6C63FF'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={iconWrap}><Lock size={18} /></div>
              <input type={showPassword ? 'text' : 'password'} placeholder="パスワード（6文字以上）" value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} onFocus={e => e.target.style.borderColor = '#6C63FF'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              <button onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {tab === 'register' && (
              <>
                <div style={{ position: 'relative' }}>
                  <div style={iconWrap}><Lock size={18} /></div>
                  <input type="password" placeholder="パスワード確認" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                    style={inputStyle} onFocus={e => e.target.style.borderColor = '#6C63FF'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <button onClick={() => setShowReferral(!showReferral)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', padding: '4px 0' }}>
                  紹介コードをお持ちですか？
                  <ChevronDown size={14} style={{ transform: showReferral ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </button>
                <AnimatePresence>
                  {showReferral && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <input type="text" placeholder="紹介コード（任意）" value={referralCode} onChange={e => setReferralCode(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 16 }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Submit */}
          <button onClick={tab === 'register' ? handleRegister : handleLogin} disabled={isSubmitting}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6C63FF, #38BDF8)', color: '#fff',
              fontSize: 16, fontWeight: 700, marginTop: 24, transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
              opacity: isSubmitting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {isSubmitting && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
            {tab === 'register' ? 'アカウント作成' : 'ログイン'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>または</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          {/* Social Login Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => { onGoogleLogin?.() }}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, border: '2px solid #e5e7eb',
                background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#1a1a2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.background = '#f8faff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff' }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.08 24.08 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Googleでログイン
            </button>

          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 16, lineHeight: 1.6 }}>
            ログインすると、<a href="#" style={{ color: '#6C63FF' }}>利用規約</a>と<a href="#" style={{ color: '#6C63FF' }}>プライバシーポリシー</a>に同意したことになります
          </p>
        </div>

        {/* Back */}
        <button onClick={() => onNavigate('landing')}
          style={{ display: 'block', margin: '20px auto 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9ca3af' }}>
          ← トップに戻る
        </button>
      </motion.div>
    </div>
  )
}
