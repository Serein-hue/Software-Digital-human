import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, User, Lock, LogIn, AlertCircle } from 'lucide-react'
import { loginAdmin } from '../api/admin'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await loginAdmin(username, password)
      if (user) {
        onLogin()
      } else {
        setError('用户名或密码错误')
      }
    } catch {
      setError('登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="login-header">
          <Sparkles size={24} />
          <h1>灵山胜境 · AI 数字人</h1>
          <p>景区导览管理平台</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <User size={16} />
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="login-field">
            <Lock size={16} />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="login-submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? '登录中...' : (
              <>
                <LogIn size={16} />
                <span>登录</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
