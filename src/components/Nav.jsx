import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Nav({ janelaBadge }) {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [clock, setClock] = useState('')
  const [janelaStatus, setJanelaStatus] = useState(null)
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ts_theme') || 'dark' } catch { return 'dark' }
  })

  useEffect(() => {
    if (!janelaBadge) { setJanelaStatus(null); return }
    if (!janelaBadge.semaforo_ativo) { setJanelaStatus({ txt: '◎ Livre', ok: true, neutral: true }); return }
    setJanelaStatus(janelaBadge.dentro_janela
      ? { txt: '✓ JANELA', ok: true }
      : { txt: '✗ FORA', ok: false })
  }, [janelaBadge])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('ts_theme', theme) } catch {}
  }, [theme])

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('pt-BR'))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  function handleLogout() { logout(); navigate('/login') }
  function toggleTheme() { setTheme(t => t === 'dark' ? 'light' : 'dark') }
  const onLancar = location.pathname === '/lancar'

  const navLinks = [
    { to: '/',            label: 'Dashboard' },
    { to: '/operar',      label: '📋 Plano' },
    { to: '/performance', label: 'Performance' },
    { to: '/lancar',      label: '✏️ Lançar', lancar: true },
    { to: '/financeiro',  label: '$ Financeiro' },
    { to: '/config',      label: '⚙ Config' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: '⚡ Sistema', admin: true }] : []),
  ]

  const mobileBottomLinks = [
    { to: '/',            label: 'Home',      icon: '⊞' },
    { to: '/operar',      label: 'Plano',     icon: '📋' },
    { to: '/lancar',      label: 'Lançar',    icon: '✏️', lancar: true },
    { to: '/financeiro',  label: 'Financeiro', icon: '💰' },
    { to: '/performance', label: 'Perf.',     icon: '📈' },
  ]

  return (
    <>
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: '54px',
      background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
        <img src="/logo-shield.png" alt="GesRisk" width="28" height="28" style={{ borderRadius: '6px', objectFit: 'contain' }} />
        <span className="nav-brand-text" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.3px' }}>
          Ges<span style={{ color: 'var(--gold)' }}>Risk</span> Trader
        </span>
      </NavLink>

      <nav className="nav-desktop-links" style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {navLinks.map(({ to, label, go, admin, lancar }) => (
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
          <span className="nav-janela-badge" style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700,
            padding: '4px 10px', borderRadius: '5px',
            background: janelaStatus.neutral ? 'transparent' : janelaStatus.ok ? 'rgba(0,229,160,.12)' : 'rgba(255,69,96,.1)',
            color: janelaStatus.neutral ? 'var(--txt3)' : janelaStatus.ok ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${janelaStatus.neutral ? 'transparent' : janelaStatus.ok ? 'rgba(0,229,160,.2)' : 'rgba(255,69,96,.2)'}`,
          }}>{janelaStatus.txt}</span>
        )}
        <span className="nav-clock" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: 'var(--txt2)' }}>{clock}</span>

        <button onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'} style={{
          padding:'4px 8px', borderRadius:'6px', fontSize:'13px', lineHeight:1,
          border:'1px solid var(--border)', background:'transparent', color:'var(--txt3)',
          cursor:'pointer', transition:'all .15s',
        }}>{theme === 'dark' ? '☀' : '◑'}</button>

        <div className="nav-user-chip" style={{
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

    {/* Barra de navegação inferior — somente mobile */}
    <nav className="nav-mobile-bottom">
      {mobileBottomLinks.map(({ to, label, icon, lancar }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-mobile-item${isActive ? ' active' : ''}${lancar ? ' lancar' : ''}`}>
          <span className="nav-mobile-icon">{icon}</span>
          <span className="nav-mobile-label">{label}</span>
        </NavLink>
      ))}
      <button onClick={handleLogout} className="nav-mobile-item nav-mobile-logout">
        <span className="nav-mobile-icon">↩</span>
        <span className="nav-mobile-label">Sair</span>
      </button>
    </nav>

    {/* FAB global — aparece em todas as páginas exceto /lancar e /login — apenas desktop */}
    {user && !onLancar && (
      <button
        className="nav-fab"
        onClick={() => navigate('/lancar')}
        style={{
          position:'fixed', bottom:'24px', right:'24px', zIndex:500,
          height:'36px', borderRadius:'18px', border:'1px solid rgba(91,164,245,.3)',
          background: theme === 'dark' ? 'rgba(17,17,21,.88)' : 'rgba(255,255,255,.92)',
          backdropFilter:'blur(10px)',
          color:'#5ba4f5', fontSize:'12px', fontWeight:700,
          padding:'0 16px', display:'flex', alignItems:'center', gap:'6px',
          boxShadow: theme === 'dark' ? '0 2px 14px rgba(0,0,0,.5)' : '0 2px 14px rgba(0,0,0,.12)',
          cursor:'pointer', transition:'all .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(91,164,245,.15)'; e.currentTarget.style.borderColor='rgba(91,164,245,.5)' }}
        onMouseLeave={e => { e.currentTarget.style.background= theme === 'dark' ? 'rgba(17,17,21,.88)' : 'rgba(255,255,255,.92)'; e.currentTarget.style.borderColor='rgba(91,164,245,.3)' }}
        title="Lançar operação"
      ><span>✏️</span> Lançar</button>
    )}
    </>
  )
}
