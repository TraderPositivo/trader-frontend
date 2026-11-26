import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const OWNER_WPP = import.meta.env.VITE_OWNER_WPP || '5500000000000'

function fmtData(iso) { return iso ? iso.split('-').reverse().join('/') : '' }

function wppLink(userName) {
  const nome = userName || 'usuário'
  const msg  = encodeURIComponent(`Olá! Sou ${nome} e meu acesso ao GesRisk Trader venceu. Gostaria de renovar.`)
  return `https://wa.me/${OWNER_WPP}?text=${msg}`
}

export default function Acesso() {
  const { user, logout, atualizar } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.post('auth', { action: 'me' })
      .then((u) => { atualizar({ ...user, ...u }); if (u.acesso_liberado) navigate('/', { replace: true }) })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function sair() { logout(); navigate('/login') }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '36px 28px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(224,92,106,.12)', border: '1px solid rgba(224,92,106,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '24px' }}>⏳</div>

        <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-.4px', marginBottom: '8px', color: 'var(--txt)' }}>Período de teste encerrado</h1>

        <p style={{ fontSize: '14px', color: 'var(--txt2)', lineHeight: 1.6, marginBottom: '10px' }}>
          {user?.acesso_ate ? <>Seu acesso expirou em <strong style={{ color: 'var(--txt)' }}>{fmtData(user.acesso_ate)}</strong>.<br /></> : ''}
          Suas contas e operações estão guardadas. Entre em contato para renovar o acesso.
        </p>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: 'var(--txt3)' }}>
          Logado como <strong style={{ color: 'var(--txt2)' }}>{user?.email || '—'}</strong>
        </div>

        <a
          href={wppLink(user?.nome)}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '10px', fontWeight: 800, fontSize: '14px', textDecoration: 'none', background: '#25D366', color: '#fff', marginBottom: '10px' }}
        >
          <span style={{ fontSize: '18px' }}>💬</span> Falar com o administrador
        </a>

        <button
          onClick={sair}
          style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--txt2)', cursor: 'pointer' }}
        >Sair da conta</button>
      </div>
    </div>
  )
}
