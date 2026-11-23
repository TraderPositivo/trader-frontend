import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

// Mostrado quando o adicional GesRisk Trader do aluno venceu.
// A renovação acontece na Área do aluno do Trader Positivo.
const AREA_DO_ALUNO = 'https://traderpositivo.github.io/aluno/'

function fmtData(iso) { return iso ? iso.split('-').reverse().join('/') : '' }

export default function Acesso() {
  const { user, logout, atualizar } = useAuth()
  const navigate = useNavigate()

  // se já foi renovado, volta direto para o sistema
  useEffect(() => {
    api.post('auth', { action: 'me' })
      .then((u) => { atualizar({ ...user, ...u }); if (u.acesso_liberado) navigate('/', { replace: true }) })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function sair() { logout(); navigate('/login') }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px 24px' }}>
        <img src="/logo-shield.png" alt="GesRisk" width="48" height="48" style={{ margin: '0 auto 14px', display: 'block' }} />
        <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-.4px', marginBottom: '8px' }}>Seu acesso ao GesRisk Trader venceu</h1>
        <p style={{ fontSize: '14px', color: 'var(--txt2)', marginBottom: '20px' }}>
          {user?.acesso_ate ? `O acesso terminou em ${fmtData(user.acesso_ate)}. ` : ''}
          Renove pela Área do aluno do Trader Positivo. Suas contas e operações continuam guardadas.
        </p>
        <a href={AREA_DO_ALUNO} style={{ display: 'block', padding: '12px', borderRadius: '10px', fontWeight: 800, fontSize: '14px', textDecoration: 'none',
          background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0c0c0e', marginBottom: '10px' }}>Ir para a Área do aluno</a>
        <button onClick={sair} style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
          border: '1px solid var(--border2)', background: 'transparent', color: 'var(--txt2)', cursor: 'pointer' }}>Sair</button>
      </div>
    </div>
  )
}
