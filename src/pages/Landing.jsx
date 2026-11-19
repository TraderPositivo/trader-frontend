import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ minHeight: '100vh', background: '#080b12', color: '#e8eaf0', fontFamily: "'Syne', sans-serif", overflowX: 'hidden' }}>

      {/* NAV */}
      <nav className="lp-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px',
        background: 'rgba(8,11,18,.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo-shield.png" alt="GesRisk" width="30" height="30" style={{ borderRadius: '6px', objectFit: 'contain' }} />
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-.3px' }}>
            Ges<span style={{ color: '#00c87a' }}>Risk</span> Trader
          </span>
        </div>

        <div className="lp-nav-links" style={{ gap: '28px', alignItems: 'center' }}>
          {[
            ['Benefícios',      'beneficios'],
            ['Recursos',        'recursos'],
            ['Como funciona',   'como-funciona'],
            ['Nossa abordagem', 'abordagem'],
            ['Contato',         'contato'],
          ].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: 'none', border: 'none', color: 'rgba(232,234,240,.65)',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              transition: 'color .15s', padding: 0,
            }}
              onMouseEnter={e => e.target.style.color = '#e8eaf0'}
              onMouseLeave={e => e.target.style.color = 'rgba(232,234,240,.65)'}
            >{label}</button>
          ))}
        </div>

        <button onClick={() => navigate('/login')} style={{
          padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
          background: '#00c87a', color: '#050709', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#00e889'}
          onMouseLeave={e => e.currentTarget.style.background = '#00c87a'}
        >
          Conhecer o GesRisk <span style={{ fontSize: '14px' }}>↗</span>
        </button>
      </nav>

      {/* HERO */}
      <section className="lp-hero lp-section lp-hero-wrap" style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid', alignItems: 'center',
        position: 'relative',
      }}>
        {/* glow verde de fundo */}
        <div style={{
          position: 'absolute', top: '10%', right: '5%',
          width: '500px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,200,122,.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* TEXTO */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            marginBottom: '28px',
          }}>
            <div style={{ width: '28px', height: '2px', background: '#00c87a' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#00c87a', textTransform: 'uppercase' }}>
              Mais clareza em cada decisão
            </span>
          </div>

          <h1 className="lp-h1" style={{ fontWeight: 800, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-1.5px' }}>
            Gestão de Risco<br />
            para Traders<br />
            <span style={{ color: '#00c87a' }}>mais consistentes</span>
          </h1>

          <p style={{ fontSize: '16px', lineHeight: 1.65, color: 'rgba(232,234,240,.7)', margin: '0 0 40px', maxWidth: '440px' }}>
            Transforme regras de risco em parte da sua rotina. Com o GesRisk Trader,
            você organiza limites, planeja operações e acompanha sua disciplina para
            tomar decisões com mais consciência.
          </p>

          <div className="lp-cta-row" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{
              padding: '13px 24px', borderRadius: '9px', fontSize: '14px', fontWeight: 700,
              background: '#00c87a', color: '#050709', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#00e889'}
              onMouseLeave={e => e.currentTarget.style.background = '#00c87a'}
            >
              Quero conhecer o sistema <span>→</span>
            </button>
            <button onClick={() => scrollTo('como-funciona')} style={{
              padding: '13px 24px', borderRadius: '9px', fontSize: '14px', fontWeight: 600,
              background: 'rgba(255,255,255,.06)', color: '#e8eaf0',
              border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
            >
              Entenda como funciona <span>↓</span>
            </button>
          </div>
        </div>

        {/* MOCKUP DO SISTEMA */}
        <div className="lp-mockup" style={{ position: 'relative' }}>
          <div style={{
            background: '#10141e', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '14px', overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(0,200,122,.08)',
          }}>
            {/* barra do browser */}
            <div style={{
              padding: '10px 14px', background: '#0d1019',
              borderBottom: '1px solid rgba(255,255,255,.06)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }} />
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,.3)', fontFamily: 'monospace', letterSpacing: '.5px' }}>
                GESRISK TRADER · VISÃO GERAL
              </span>
            </div>

            {/* conteúdo do mockup */}
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#e8eaf0' }}>Seu plano de risco</div>
                  <div style={{ fontSize: '11px', color: 'rgba(232,234,240,.45)', marginTop: '2px' }}>Organize os parâmetros antes de operar</div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 700,
                  background: 'rgba(0,200,122,.12)', color: '#00c87a',
                  border: '1px solid rgba(0,200,122,.2)', letterSpacing: '.5px',
                }}>● PLANO ATIVO</div>
              </div>

              {/* cards de métricas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {[
                  { label: 'Risco por operação', value: 'Definido', color: '#e8eaf0' },
                  { label: 'Limite diário',       value: 'Definido', color: '#e8eaf0' },
                  { label: 'Plano de execução',   value: 'Em foco',  color: '#00c87a' },
                ].map(c => (
                  <div key={c.label} style={{
                    padding: '12px', borderRadius: '8px',
                    background: '#151a26', border: '1px solid rgba(255,255,255,.07)',
                  }}>
                    <div style={{ fontSize: '10px', color: 'rgba(232,234,240,.45)', marginBottom: '6px' }}>{c.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* checklist */}
              {[
                ['Parâmetros revisados', 'ORGANIZADO'],
                ['Limites à vista',      'CLAREZA'   ],
                ['Rotina acompanhada',   'DISCIPLINA'],
              ].map(([item, badge]) => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: '7px', marginBottom: '6px',
                  background: '#151a26', border: '1px solid rgba(255,255,255,.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#00c87a', fontSize: '13px' }}>✓</span>
                    <span style={{ fontSize: '12px', color: 'rgba(232,234,240,.8)' }}>{item}</span>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(232,234,240,.35)', letterSpacing: '1px' }}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* tag flutuante */}
          <div style={{
            position: 'absolute', bottom: '-14px', right: '20px',
            padding: '8px 16px', borderRadius: '20px',
            background: '#00c87a', color: '#050709',
            fontSize: '12px', fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,200,122,.35)',
          }}>
            Menos improviso. Mais processo.
          </div>

          <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '11px', color: 'rgba(232,234,240,.3)' }}>
            Visual ilustrativo da proposta do sistema
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section id="beneficios" className="lp-section" style={{ background: '#0c0f17', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#00c87a', textTransform: 'uppercase' }}>
              Benefícios
            </span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '12px 0 0', letterSpacing: '-1px' }}>
              Tudo que você precisa para operar com disciplina
            </h2>
          </div>

          <div className="lp-benefits" style={{ display: 'grid', gap: '20px' }}>
            {[
              { icon: '🎯', title: 'Plano de risco definido',     desc: 'Configure seu risco por operação, limite diário e metas antes de abrir qualquer posição.' },
              { icon: '📊', title: 'Performance em tempo real',   desc: 'Acompanhe seus resultados com gráficos de evolução, drawdown e consistência de retorno.' },
              { icon: '✏️', title: 'Lançamento simplificado',     desc: 'Registre operações em segundos. O sistema calcula resultado, R:R e atualiza o dashboard.' },
              { icon: '💰', title: 'Controle financeiro',         desc: 'Visão completa de capital, saques, aportes e evolução patrimonial por período.' },
              { icon: '⚙️', title: 'Configurações personalizadas', desc: 'Adapte o sistema ao seu estilo: semáforo de janela, alertas de risco e muito mais.' },
              { icon: '🔒', title: 'Dados 100% seus',             desc: 'Seus lançamentos ficam em conta própria. Sem compartilhamento, sem exposição.' },
            ].map(b => (
              <div key={b.title} style={{
                padding: '24px', borderRadius: '12px',
                background: '#10141e', border: '1px solid rgba(255,255,255,.07)',
                transition: 'border-color .2s, transform .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,122,.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{b.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#e8eaf0' }}>{b.title}</div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(232,234,240,.55)' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="lp-section">
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#00c87a', textTransform: 'uppercase' }}>
            Como funciona
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '12px 0 48px', letterSpacing: '-1px' }}>
            Simples, direto, eficiente
          </h2>

          <div className="lp-steps" style={{ display: 'grid', gap: '0' }}>
            {[
              { n: '01', title: 'Configure seu plano', desc: 'Defina risco por operação, limite de perda diária e janela de operação.' },
              { n: '02', title: 'Lance suas operações', desc: 'Registre cada trade com ativo, direção, entrada, saída e resultado.' },
              { n: '03', title: 'Acompanhe a evolução', desc: 'Veja métricas de performance, curva de capital e consistência.' },
            ].map((step) => (
              <div key={step.n} className="lp-step" style={{
                padding: '32px 28px', position: 'relative',
              }}>
                <div style={{ fontSize: '48px', fontWeight: 900, color: 'rgba(0,200,122,.12)', lineHeight: 1, marginBottom: '16px' }}>{step.n}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: '#e8eaf0' }}>{step.title}</div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(232,234,240,.55)' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="contato" className="lp-section" style={{
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(0,200,122,.04))',
        borderTop: '1px solid rgba(255,255,255,.05)',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <img src="/logo-shield.png" alt="GesRisk" width="56" height="56" style={{ borderRadius: '12px', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1px' }}>
            Pronto para operar com mais <span style={{ color: '#00c87a' }}>consistência</span>?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(232,234,240,.6)', margin: '0 0 36px', lineHeight: 1.6 }}>
            Acesse agora e comece a transformar suas regras de risco em rotina.
          </p>
          <button onClick={() => navigate('/login')} style={{
            padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
            background: '#00c87a', color: '#050709', border: 'none', cursor: 'pointer',
            transition: 'background .15s, transform .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00e889'; e.currentTarget.style.transform = 'scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#00c87a'; e.currentTarget.style.transform = 'none' }}
          >
            Acessar o sistema →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer" style={{
        borderTop: '1px solid rgba(255,255,255,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '12px', color: 'rgba(232,234,240,.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo-shield.png" alt="" width="20" height="20" style={{ borderRadius: '4px', opacity: .6 }} />
          GesRisk Trader — Gestão de performance em trading
        </div>
        <div>© {new Date().getFullYear()} Todos os direitos reservados</div>
      </footer>
    </div>
  )
}
