import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Nav({ janelaBadge }) {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [clock, setClock] = useState('')
  const [janelaStatus, setJanelaStatus] = useState(null)

  useEffect(() => {
    if (!janelaBadge) { setJanelaStatus(null); return }
    if (!janelaBadge.semaforo_ativo) { setJanelaStatus({ txt: '◎ Livre', ok: true, neutral: true }); return }
    setJanelaStatus(janelaBadge.dentro_janela
      ? { txt: '✓ JANELA', ok: true }
      : { txt: '✗ FORA', ok: false })
  }, [janelaBadge])

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('pt-BR'))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  function handleLogout() { logout(); navigate('/login') }
  const onLancar = location.pathname === '/lancar'

  return (
    <>
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: '54px',
      background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px',
          background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 900, color: '#0c0c0e',
        }}>▲</div>
        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.3px' }}>
          Trader<span style={{ color: 'var(--gold)' }}>System</span>
        </span>
      </NavLink>

      <nav style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[
          { to: '/',            label: 'Dashboard' },
          { to: '/operar',      label: '📋 Plano' },
          { to: '/performance', label: 'Performance' },
          { to: '/lancar',      label: '✏️ Lançar', lancar: true },
          { to: '/aluno',       label: '🎓 Aluno' },
          { to: '/config',      label: '⚙ Config' },
          ...(user?.role === 'admin' ? [{ to: '/admin', label: '⚡ Sistema', admin: true }] : []),
        ].map(({ to, label, go, admin, lancar }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            padding: '5px 13px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            textDecoration: 'none', transition: 'all .15s',
            background: lancar
              ? (isActive ? 'rgba(91,164,245,.2)' : 'rgba(91,164,245,.07)')
              : go
                ? (isActive ? 'rgba(0,229,160,.2)' : 'rgba(0,229,160,.08)')
                : isActive ? (admin ? 'rgba(212,168,67,.1)' : 'var(--gold-bg)') : 'transparent',
            color: lancar ? '#5ba4f5'
              : go ? 'var(--green)'
              : isActive ? (admin ? 'var(--yellow)' : 'var(--gold)') : (admin ? 'var(--yellow)' : 'var(--txt2)'),
            border: lancar
              ? `1px solid ${isActive ? 'rgba(91,164,245,.4)' : 'rgba(91,164,245,.2)'}`
              : go
                ? `1px solid ${isActive ? 'rgba(0,229,160,.4)' : 'rgba(0,229,160,.2)'}`
                : isActive ? `1px solid ${admin ? 'rgba(212,168,67,.25)' : 'var(--gold-bd)'}` : '1px solid transparent',
          })}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {janelaStatus && (
          <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700,
            padding: '4px 10px', borderRadius: '5px',
            background: janelaStatus.neutral ? 'transparent' : janelaStatus.ok ? 'rgba(0,229,160,.12)' : 'rgba(255,69,96,.1)',
            color: janelaStatus.neutral ? 'var(--txt3)' : janelaStatus.ok ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${janelaStatus.neutral ? 'transparent' : janelaStatus.ok ? 'rgba(0,229,160,.2)' : 'rgba(255,69,96,.2)'}`,
          }}>{janelaStatus.txt}</span>
        )}
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: 'var(--txt2)' }}>{clock}</span>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '5px 11px',
        }}>
          {user?.role === 'admin' && (
            <span style={{
              fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
              background: 'rgba(212,168,67,.15)', color: 'var(--yellow)',
              borderRadius: '3px', padding: '2px 6px', fontFamily: "'JetBrains Mono',monospace",
            }}>admin</span>
          )}
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt2)' }}>{user?.nome || ''}</span>
        </div>

        <button onClick={handleLogout} style={{
          padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
          border: '1px solid var(--border2)', background: 'transparent', color: 'var(--txt3)',
        }}
          onMouseEnter={e => { e.target.style.background='var(--red)'; e.target.style.color='#fff'; e.target.style.borderColor='var(--red)' }}
          onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color='var(--txt3)'; e.target.style.borderColor='var(--border2)' }}>
          Sair
        </button>
      </div>
    </header>

    {/* FAB global — aparece em todas as páginas exceto /lancar e /login */}
    {user && !onLancar && (
      <button
        onClick={() => navigate('/lancar')}
        style={{
          position:'fixed', bottom:'24px', right:'24px', zIndex:500,
          height:'36px', borderRadius:'18px', border:'1px solid rgba(91,164,245,.3)',
          background:'rgba(12,12,14,.75)', backdropFilter:'blur(8px)',
          color:'#5ba4f5', fontSize:'12px', fontWeight:700,
          padding:'0 16px', display:'flex', alignItems:'center', gap:'6px',
          boxShadow:'0 2px 14px rgba(0,0,0,.4)', cursor:'pointer', transition:'all .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(91,164,245,.15)'; e.currentTarget.style.borderColor='rgba(91,164,245,.5)' }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(12,12,14,.75)'; e.currentTarget.style.borderColor='rgba(91,164,245,.3)' }}
        title="Lançar operação"
      ><span>✏️</span> Lançar</button>
    )}
    </>
  )
}
