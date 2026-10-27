import Nav from '../components/Nav'
import { useAuth } from '../context/AuthContext'
import { INDICADORES, INSTALACAO_URL, LIVES, AULAS } from '../lib/conteudoAluno'

const card = { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'18px' }
const titulo = { fontSize:'16px', fontWeight:800, letterSpacing:'-.2px', color:'var(--txt)' }
const sub = { fontSize:'12px', color:'var(--txt2)' }

function Botao({ href, children, primario }) {
  if (!href) {
    return (
      <span style={{ display:'inline-block', padding:'7px 13px', borderRadius:'7px', fontSize:'11px', fontWeight:700,
        background:'var(--bg3)', color:'var(--txt3)', border:'1px solid var(--border)' }}>Em breve</span>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display:'inline-block', padding:'7px 13px', borderRadius:'7px', fontSize:'11px', fontWeight:700, textDecoration:'none',
      background: primario ? 'var(--gold)' : 'var(--gold-bg)', color: primario ? '#0c0c0e' : 'var(--gold)',
      border: `1px solid ${primario ? 'var(--gold)' : 'var(--gold-bd)'}`,
    }}>{children}</a>
  )
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
  return (
    <div style={{ ...card, textAlign:'center', color:'var(--txt3)', fontSize:'13px', borderStyle:'dashed', background:'transparent' }}>
      {texto}
    </div>
  )
}

export default function Aluno() {
  const { user } = useAuth()
  const primeiroNome = (user?.nome || '').split(' ')[0]

  return (
    <div>
      <Nav />
      <main style={{ padding:'24px', maxWidth:'1000px', margin:'0 auto' }}>
        <div style={{ ...card, padding:'22px 24px', background:'linear-gradient(135deg, rgba(201,168,76,.12), var(--bg2) 60%)', borderColor:'var(--gold-bd)' }}>
          <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--gold)', marginBottom:'6px' }}>🎓 Área do aluno</div>
          <h1 style={{ fontSize:'24px', fontWeight:800, letterSpacing:'-.5px', marginBottom:'4px' }}>
            {primeiroNome ? `Bem-vindo, ${primeiroNome}.` : 'Bem-vindo à sala.'}
          </h1>
          <p style={{ ...sub, fontSize:'13px', maxWidth:'560px' }}>
            Indicadores, lives gravadas e aulas do Trader Positivo. A gestão das suas contas continua nas outras abas do sistema.
          </p>
        </div>

        <Secao icone="📈" nome="Indicadores Trader Positivo" descricao="Para MetaTrader 5, com os dados da B3."
          acao={<Botao href={INSTALACAO_URL}>Como instalar</Botao>}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px' }}>
            {INDICADORES.map(ind => (
              <div key={ind.nome} style={{ ...card, display:'flex', flexDirection:'column', gap:'8px' }}>
                <div style={titulo}>{ind.nome}</div>
                <div style={{ ...sub, flex:1 }}>{ind.desc}</div>
                <div><Botao href={ind.download} primario>Baixar</Botao></div>
              </div>
            ))}
          </div>
        </Secao>

        <Secao icone="▶️" nome="Lives gravadas" descricao="Replay das sessões da sala ao vivo.">
          {LIVES.length === 0 ? <Vazio texto="As lives gravadas vão aparecer aqui em breve." /> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'10px' }}>
              {LIVES.map(l => (
                <div key={l.titulo} style={{ ...card, display:'flex', flexDirection:'column', gap:'8px' }}>
                  <div style={titulo}>{l.titulo}</div>
                  <div style={sub}>{[l.data, l.duracao].filter(Boolean).join(' · ')}</div>
                  <div><Botao href={l.youtube} primario>Assistir</Botao></div>
                </div>
              ))}
            </div>
          )}
        </Secao>

        <Secao icone="🎬" nome="Aulas no YouTube" descricao="Metodologia, indicadores e gestão de risco.">
          {AULAS.length === 0 ? <Vazio texto="As aulas vão aparecer aqui em breve." /> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'10px' }}>
              {AULAS.map(a => (
                <div key={a.titulo} style={{ ...card, display:'flex', flexDirection:'column', gap:'8px' }}>
                  <div style={titulo}>{a.titulo}</div>
                  {a.desc && <div style={sub}>{a.desc}</div>}
                  <div><Botao href={a.youtube} primario>Ver no YouTube</Botao></div>
                </div>
              ))}
            </div>
          )}
        </Secao>
      </main>
    </div>
  )
}
