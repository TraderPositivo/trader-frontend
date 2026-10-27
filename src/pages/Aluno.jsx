import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { INDICADORES, INSTALACAO_URL, LIVES, AULAS, ZOOM_URL, RENOVAR_URL } from '../lib/conteudoAluno'

// Área do aluno: a porta de entrada depois do login. O TraderSystem é um dos
// itens daqui e só abre com o plano em dia (o servidor também confere).

const PLANOS = { lives: 'Lives Gravadas', sala: 'Sala ao Vivo', mentoria: 'Mentoria' }
const card = { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'18px' }
const sub = { fontSize:'12px', color:'var(--txt2)' }

function fmtData(iso) { return iso ? iso.split('-').reverse().join('/') : '' }

function Botao({ href, to, children, primario, travado }) {
  const estilo = {
    display:'inline-block', padding:'8px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:700, textDecoration:'none',
    background: primario ? 'var(--gold)' : 'var(--gold-bg)', color: primario ? '#0c0c0e' : 'var(--gold)',
    border: `1px solid ${primario ? 'var(--gold)' : 'var(--gold-bd)'}`,
  }
  if (travado) return <span style={{ ...estilo, background:'var(--bg3)', color:'var(--txt3)', border:'1px solid var(--border)' }}>🔒 Bloqueado</span>
  if (to) return <Link to={to} style={estilo}>{children}</Link>
  if (!href) return <span style={{ ...estilo, background:'var(--bg3)', color:'var(--txt3)', border:'1px solid var(--border)' }}>Em breve</span>
  return <a href={href} target="_blank" rel="noopener noreferrer" style={estilo}>{children}</a>
}

function Secao({ icone, nome, descricao, acao, children }) {
  return (
    <section style={{ marginTop:'28px' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'12px', flexWrap:'wrap', marginBottom:'12px' }}>
        <div>
          <h2 style={{ fontSize:'18px', fontWeight:800, letterSpacing:'-.3px' }}>{icone} {nome}</h2>
          <p style={sub}>{descricao}</p>
        </div>
        {acao}
      </div>
      {children}
    </section>
  )
}

function Vazio({ texto }) {
  return <div style={{ ...card, textAlign:'center', color:'var(--txt3)', fontSize:'13px', borderStyle:'dashed', background:'transparent' }}>{texto}</div>
}

function Lista({ itens, botao, travado }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'10px' }}>
      {itens.map(i => (
        <div key={i.titulo || i.nome} style={{ ...card, display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ fontSize:'15px', fontWeight:800, letterSpacing:'-.2px' }}>{i.titulo || i.nome}</div>
          <div style={{ ...sub, flex:1 }}>{i.desc || [i.data, i.duracao].filter(Boolean).join(' · ')}</div>
          <div><Botao href={i.download || i.youtube} primario travado={travado}>{botao}</Botao></div>
        </div>
      ))}
    </div>
  )
}

export default function Aluno() {
  const { user, logout, atualizar } = useAuth()
  const navigate = useNavigate()
  const [conferido, setConferido] = useState(false)

  // confere plano e validade no servidor a cada visita (a sessão pode estar velha)
  useEffect(() => {
    api.post('auth', { action: 'me' })
      .then(u => atualizar({ ...user, ...u }))
      .catch(() => {})
      .finally(() => setConferido(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const admin    = user?.role === 'admin'
  const liberado = admin || user?.acesso_liberado !== false
  const temSala  = admin || ['sala', 'mentoria'].includes(user?.plano)
  const nome     = (user?.nome || '').split(' ')[0]

  function sair() { logout(); navigate('/login') }

  return (
    <div style={{ minHeight:'100vh' }}>
      <style>{'@media (max-width: 560px) { .so-largo { display: none } }'}</style>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', padding:'0 24px', height:'54px',
        background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'linear-gradient(135deg, #c9a84c, #e8c97a)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, color:'#0c0c0e' }}>▲</div>
          <span style={{ fontSize:'15px', fontWeight:800, letterSpacing:'-.3px' }}>
            Trader<span style={{ color:'var(--gold)' }}>Positivo</span>
            <span className="so-largo" style={{ color:'var(--txt3)', fontWeight:600 }}> · Área do aluno</span>
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {admin && <Link to="/admin" style={{ fontSize:'12px', fontWeight:600, color:'var(--yellow)', textDecoration:'none' }}>⚡ Admin</Link>}
          <span className="so-largo" style={{ fontSize:'12px', fontWeight:600, color:'var(--txt2)' }}>{user?.nome}</span>
          <button onClick={sair} style={{ padding:'5px 12px', borderRadius:'6px', fontSize:'11px', fontWeight:600,
            border:'1px solid var(--border2)', background:'transparent', color:'var(--txt3)' }}>Sair</button>
        </div>
      </header>

      <main style={{ padding:'24px', maxWidth:'1000px', margin:'0 auto' }}>
        <div style={{ ...card, padding:'22px 24px', background:'linear-gradient(135deg, rgba(201,168,76,.12), var(--bg2) 60%)', borderColor:'var(--gold-bd)',
          display:'flex', justifyContent:'space-between', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:'24px', fontWeight:800, letterSpacing:'-.5px', marginBottom:'4px' }}>
              {nome ? `Bem-vindo, ${nome}.` : 'Bem-vindo à sala.'}
            </h1>
            <p style={{ ...sub, fontSize:'13px' }}>
              {admin ? 'Administrador · acesso completo'
                : `Plano ${PLANOS[user?.plano] || '—'}${user?.acesso_ate ? (liberado ? ` · acesso até ${fmtData(user.acesso_ate)}` : ` · venceu em ${fmtData(user.acesso_ate)}`) : ''}`}
            </p>
          </div>
          {!liberado && <a href={RENOVAR_URL} target="_blank" rel="noopener noreferrer" style={{ padding:'10px 18px', borderRadius:'9px', fontSize:'13px', fontWeight:800,
            background:'var(--gold)', color:'#0c0c0e', textDecoration:'none' }}>Renovar plano</a>}
        </div>

        {!liberado && conferido && (
          <div style={{ ...card, marginTop:'14px', background:'var(--red-bg)', borderColor:'var(--red-bd)', color:'var(--red)', fontSize:'13px', fontWeight:600 }}>
            Seu acesso venceu. O TraderSystem, a sala e os materiais voltam assim que o plano for renovado. Seus dados e operações continuam guardados.
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'12px', marginTop:'18px' }}>
          <div style={{ ...card, borderColor: liberado ? 'var(--gold-bd)' : 'var(--border)', display:'flex', flexDirection:'column', gap:'8px' }}>
            <div style={{ fontSize:'26px' }}>📊</div>
            <div style={{ fontSize:'17px', fontWeight:800 }}>TraderSystem</div>
            <div style={{ ...sub, flex:1 }}>Gestão de risco das suas contas: dashboard, plano do pregão, lançamentos e performance.</div>
            <div><Botao to="/" primario travado={!liberado}>Abrir o TraderSystem →</Botao></div>
          </div>
          <div style={{ ...card, display:'flex', flexDirection:'column', gap:'8px' }}>
            <div style={{ fontSize:'26px' }}>🔴</div>
            <div style={{ fontSize:'17px', fontWeight:800 }}>Sala ao vivo</div>
            <div style={{ ...sub, flex:1 }}>
              {temSala ? 'Segunda a sexta, das 9h ao meio-dia, operando junto com o Marcelo.' : 'Disponível nos planos Sala ao Vivo e Mentoria.'}
            </div>
            <div>{temSala ? <Botao href={ZOOM_URL} primario travado={!liberado}>Entrar na sala</Botao>
              : <a href={RENOVAR_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize:'12px', fontWeight:700, color:'var(--gold)' }}>Conhecer os planos →</a>}</div>
          </div>
        </div>

        <Secao icone="📈" nome="Indicadores Trader Positivo" descricao="Para MetaTrader 5, com os dados da B3."
          acao={<Botao href={INSTALACAO_URL} travado={!liberado}>Como instalar</Botao>}>
          <Lista itens={INDICADORES} botao="Baixar" travado={!liberado} />
        </Secao>

        <Secao icone="▶️" nome="Lives gravadas" descricao="Replay das sessões da sala ao vivo.">
          {LIVES.length === 0 ? <Vazio texto="As lives gravadas vão aparecer aqui em breve." /> : <Lista itens={LIVES} botao="Assistir" travado={!liberado} />}
        </Secao>

        <Secao icone="🎬" nome="Aulas no YouTube" descricao="Metodologia, indicadores e gestão de risco.">
          {AULAS.length === 0 ? <Vazio texto="As aulas vão aparecer aqui em breve." /> : <Lista itens={AULAS} botao="Ver no YouTube" travado={!liberado} />}
        </Secao>
      </main>
    </div>
  )
}
