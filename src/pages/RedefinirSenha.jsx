import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function RedefinirSenha() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token') || ''
  const [senha,    setSenha]    = useState('')
  const [confirma, setConfirma] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [ok,       setOk]       = useState(false)
  const [erro,     setErro]     = useState('')
  const navigate                = useNavigate()

  useEffect(() => {
    if (!token) setErro('Link inválido. Solicite uma nova recuperação de senha.')
  }, [token])

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: '8px', fontSize: '14px',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    color: 'var(--txt)', outline: 'none', boxSizing: 'border-box',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (senha !== confirma) { setErro('As senhas não coincidem'); return }
    if (senha.length < 6)   { setErro('A senha precisa ter pelo menos 6 caracteres'); return }
    setLoading(true)
    try {
      await api.post('auth', { action: 'redefinir_senha', token, nova_senha: senha })
      setOk(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img src="/logo-shield.png" alt="GesRisk Trader" width="72" height="72"
            style={{ marginBottom: '14px', borderRadius: '14px', objectFit: 'contain' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt)' }}>
            Ges<span style={{ color: 'var(--gold)' }}>Risk</span> Trader
          </div>
        </div>

        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '32px',
        }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--txt)' }}>
            Criar nova senha
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'var(--txt3)' }}>
            Escolha uma senha com pelo menos 6 caracteres.
          </p>

          {ok ? (
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', color: '#4ade80', fontSize: '14px' }}>
              ✓ Senha redefinida com sucesso! Redirecionando para o login…
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: '6px' }}>
                  Nova senha
                </label>
                <input
                  type="password" value={senha} onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••" required minLength={6} style={inp}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: '6px' }}>
                  Confirmar nova senha
                </label>
                <input
                  type="password" value={confirma} onChange={e => setConfirma(e.target.value)}
                  placeholder="••••••••" required style={inp}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>

              {erro && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', color: 'var(--red)' }}>
                  {erro}
                  {(erro.includes('expirado') || erro.includes('inválido')) && (
                    <div style={{ marginTop: '8px' }}>
                      <Link to="/esqueceu-senha" style={{ color: 'var(--gold)', fontWeight: 600 }}>Solicitar novo link</Link>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading || !token} style={{
                width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                background: 'linear-gradient(135deg,#00c87a,#39ffa8)',
                color: '#0c0c0e', border: 'none',
                opacity: (loading || !token) ? .7 : 1, cursor: (loading || !token) ? 'default' : 'pointer',
              }}>
                {loading ? 'Salvando…' : 'Salvar nova senha'}
              </button>

              <p style={{ textAlign: 'center', margin: 0 }}>
                <Link to="/login" style={{ fontSize: '12px', color: 'var(--txt3)', textDecoration: 'none' }}>
                  ← Voltar para o login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
