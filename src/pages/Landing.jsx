import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

const KIWIFY_MENSAL    = '#planos'
const KIWIFY_SEMESTRAL = '#planos'
const KIWIFY_ANUAL     = '#planos'

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
          <span className="lp-nav-brand" style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-.3px' }}>
            Ges<span style={{ color: '#00c87a' }}>Risk</span> Trader
          </span>
        </div>

        <div className="lp-nav-links" style={{ gap: '28px', alignItems: 'center' }}>
          {[
            ['Problema',       'problema'],
            ['Funcionalidades','funcionalidades'],
            ['Planos',         'planos'],
            ['Como funciona',  'como-funciona'],
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

        <button className="lp-nav-cta" onClick={() => scrollTo('planos')} style={{
          padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
          background: '#00c87a', color: '#050709', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', transition: 'background .15s',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#00e889'}
          onMouseLeave={e => e.currentTarget.style.background = '#00c87a'}
        >
          <span className="lp-nav-cta-long">Ver planos</span>
          <span className="lp-nav-cta-short">Planos</span>
          <span style={{ fontSize: '14px' }}>↗</span>
        </button>
      </nav>

      {/* HERO */}
      <section className="lp-hero lp-section lp-hero-wrap" style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid', alignItems: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '10%', right: '5%',
          width: '500px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,200,122,.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{ width: '28px', height: '2px', background: '#00c87a' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#00c87a', textTransform: 'uppercase' }}>
              Gestão de risco independente
            </span>
          </div>

          <h1 className="lp-h1" style={{ fontWeight: 800, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-1.5px' }}>
            O único sistema web<br />
            de gestão de risco<br />
            <span style={{ color: '#00c87a' }}>para day trader</span>
          </h1>

          <p className="lp-desc" style={{ fontSize: '16px', lineHeight: 1.65, color: 'rgba(232,234,240,.7)', margin: '0 0 16px', maxWidth: '480px' }}>
            Não é planilha. Não está preso em nenhuma corretora.
            Funciona no celular, no Profit, no MT5 e no Tryd.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '36px' }}>
            {['✓ Semáforo de janela', '✓ DARF automático', '✓ Multi-conta', '✓ Acesso em qualquer dispositivo'].map(tag => (
              <span key={tag} style={{
                fontSize: '12px', fontWeight: 600, color: '#00c87a',
                background: 'rgba(0,200,122,.08)', border: '1px solid rgba(0,200,122,.18)',
                borderRadius: '20px', padding: '4px 12px',
              }}>{tag}</span>
            ))}
          </div>

          <div className="lp-cta-row" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('planos')} style={{
              padding: '13px 24px', borderRadius: '9px', fontSize: '14px', fontWeight: 700,
              background: '#00c87a', color: '#050709', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#00e889'}
              onMouseLeave={e => e.currentTarget.style.background = '#00c87a'}
            >
              Ver planos e preços <span>→</span>
            </button>
            <button onClick={() => navigate('/login')} style={{
              padding: '13px 24px', borderRadius: '9px', fontSize: '14px', fontWeight: 600,
              background: 'rgba(255,255,255,.06)', color: '#e8eaf0',
              border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
            >
              Já tenho acesso <span>↗</span>
            </button>
          </div>
        </div>

        {/* MOCKUP */}
        <div className="lp-mockup" style={{ position: 'relative' }}>
          <div style={{
            background: '#10141e', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '14px', overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(0,200,122,.08)',
          }}>
            <div style={{
              padding: '10px 14px', background: '#0d1019',
              borderBottom: '1px solid rgba(255,255,255,.06)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }} />
              <span style={{ marginLeft: '8px', fontSize: '10px', color: 'rgba(255,255,255,.3)', fontFamily: 'monospace' }}>
                gesrisktrader.com.br
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: '9px', fontWeight: 700, color: '#00c87a',
                background: 'rgba(0,200,122,.12)', border: '1px solid rgba(0,200,122,.2)',
                borderRadius: '4px', padding: '2px 7px', letterSpacing: '.5px',
              }}>✓ JANELA</span>
            </div>

            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {[
                  { label: 'Resultado hoje', value: '+R$ 320', color: '#00c87a' },
                  { label: 'Risco restante',  value: 'R$ 180',  color: '#e8eaf0' },
                  { label: 'DARF acumulado', value: 'R$ 42,30', color: '#d4a843' },
                ].map(c => (
                  <div key={c.label} style={{ padding: '12px', borderRadius: '8px', background: '#151a26', border: '1px solid rgba(255,255,255,.07)' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(232,234,240,.45)', marginBottom: '6px' }}>{c.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {[
                { op: 'WINZ25 · Long',  result: '+R$ 180', color: '#00c87a' },
                { op: 'WINZ25 · Long',  result: '+R$ 140', color: '#00c87a' },
                { op: 'WINZ25 · Short', result: '−R$ 60',  color: '#e05c6a' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: '7px', marginBottom: '5px',
                  background: '#151a26', border: '1px solid rgba(255,255,255,.05)',
                }}>
                  <span style={{ fontSize: '12px', color: 'rgba(232,234,240,.7)', fontFamily: 'monospace' }}>{row.op}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: row.color }}>{row.result}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: '-14px', right: '20px',
            padding: '8px 16px', borderRadius: '20px',
            background: '#00c87a', color: '#050709',
            fontSize: '12px', fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,200,122,.35)',
          }}>
            Funciona em qualquer plataforma
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="problema" className="lp-section" style={{ background: '#0c0f17', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#e05c6a', textTransform: 'uppercase' }}>
            O problema
          </span>
          <h2 className="lp-h2" style={{ fontWeight: 800, margin: '12px 0 20px', letterSpacing: '-1px' }}>
            Você já tentou controlar o risco.<br />O problema é com as ferramentas.
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(232,234,240,.6)', marginBottom: '48px', lineHeight: 1.7 }}>
            Toda plataforma de trade tem um gestor de risco embutido — mas ele para de funcionar quando você fecha o programa.
            Não abre no celular. Não consolida várias contas. E nenhuma exporta o DARF automaticamente.
          </p>

          <div className="lp-benefits" style={{ display: 'grid', gap: '16px', textAlign: 'left' }}>
            {[
              {
                icon: '📊', title: 'Planilha do Excel',
                desc: 'Precisa abrir o computador. Não atualiza em tempo real. Não funciona no celular quando você está operando.',
                tag: 'Estático',
              },
              {
                icon: '🖥️', title: 'Profit / MT5 / Tryd',
                desc: 'Gestão de risco presa dentro da plataforma. Fecha o Profit, perdeu o controle. Não consolida múltiplas contas.',
                tag: 'Dependente da plataforma',
              },
              {
                icon: '📓', title: 'Diários de trade',
                desc: 'Foco em análise histórica, não em controle de risco em tempo real. Não bloqueia você de operar fora da janela.',
                tag: 'Pós-trade',
              },
            ].map(b => (
              <div key={b.title} style={{
                padding: '20px', borderRadius: '12px',
                background: '#10141e', border: '1px solid rgba(224,92,106,.15)',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{b.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#e8eaf0' }}>{b.title}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: 'rgba(224,92,106,.8)',
                      background: 'rgba(224,92,106,.1)', border: '1px solid rgba(224,92,106,.2)',
                      borderRadius: '4px', padding: '2px 7px', letterSpacing: '.5px',
                    }}>{b.tag}</span>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(232,234,240,.55)' }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="lp-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#00c87a', textTransform: 'uppercase' }}>
              A solução
            </span>
            <h2 className="lp-h2" style={{ fontWeight: 800, margin: '12px 0 12px', letterSpacing: '-1px' }}>
              Gestão de risco na web,<br />funciona em qualquer lugar
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(232,234,240,.55)', maxWidth: '540px', margin: '0 auto' }}>
              Acesse pelo celular antes de abrir posição, acompanhe no computador durante a operação,
              e consulte o histórico de qualquer dispositivo.
            </p>
          </div>

          <div className="lp-benefits" style={{ display: 'grid', gap: '20px' }}>
            {[
              {
                icon: '🚦',
                title: 'Semáforo de janela de operação',
                desc: 'Configure horários permitidos e o sistema indica em tempo real se você está dentro ou fora da sua janela. Nunca mais opere por impulso fora do horário.',
              },
              {
                icon: '💰',
                title: 'DARF calculado automaticamente',
                desc: 'As notas de corretagem são importadas via PDF. O sistema calcula o imposto sobre ganho líquido, diferido e gera o resumo mensal pronto para pagar.',
              },
              {
                icon: '📂',
                title: 'Multi-conta e multi-ativo',
                desc: 'Opere WIN e WDO ao mesmo tempo, em contas diferentes, e veja o resultado consolidado. Cada conta tem suas próprias regras de risco.',
              },
              {
                icon: '📱',
                title: 'Mobile first — acessa de qualquer lugar',
                desc: 'Layout otimizado para celular. Consulte o semáforo, seu resultado do dia e o limite restante direto do celular, sem precisar abrir o computador.',
              },
              {
                icon: '🎯',
                title: 'Plano de operação antes de entrar',
                desc: 'Defina os parâmetros — ativo, direção, entrada, alvo e stop — antes de abrir posição. O sistema compara com seus limites e dá o sinal verde.',
              },
              {
                icon: '📈',
                title: 'Performance e consistência',
                desc: 'Curva de capital, drawdown máximo, % de dias lucrativos e evolução mês a mês. Visualize sua consistência, não só o resultado.',
              },
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

      {/* COMPARATIVO */}
      <section className="lp-section" style={{ background: '#0c0f17', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#00c87a', textTransform: 'uppercase' }}>
              Comparativo
            </span>
            <h2 className="lp-h2" style={{ fontWeight: 800, margin: '12px 0 0', letterSpacing: '-1px' }}>
              GesRisk vs as outras opções
            </h2>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '560px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(232,234,240,.45)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,.07)' }}>Funcionalidade</th>
                  {['GesRisk', 'Planilha', 'Profit/MT5', 'Diário de trade'].map((h, i) => (
                    <th key={h} style={{
                      textAlign: 'center', padding: '12px 16px',
                      fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.07)',
                      color: i === 0 ? '#00c87a' : 'rgba(232,234,240,.45)',
                      background: i === 0 ? 'rgba(0,200,122,.04)' : 'transparent',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Acesso pelo celular',              '✓', '✗', '✗', '✓'],
                  ['Semáforo em tempo real',            '✓', '✗', '✓*', '✗'],
                  ['Funciona em qualquer plataforma',   '✓', '✓', '✗', '✓'],
                  ['Multi-conta consolidada',           '✓', 'Manual', '✗', '✗'],
                  ['DARF automático',                   '✓', 'Manual', '✗', '✗'],
                  ['Import PDF de corretagem',          '✓', '✗', '✗', 'Parcial'],
                  ['Histórico na nuvem',                '✓', '✗', '✗', '✓'],
                ].map(([feat, ...vals]) => (
                  <tr key={feat} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding: '11px 16px', color: 'rgba(232,234,240,.7)', fontWeight: 500 }}>{feat}</td>
                    {vals.map((v, i) => (
                      <td key={i} style={{
                        padding: '11px 16px', textAlign: 'center',
                        color: v === '✓' ? '#00c87a' : v === '✗' ? '#e05c6a' : 'rgba(232,234,240,.45)',
                        fontWeight: v === '✓' || v === '✗' ? 700 : 500,
                        background: i === 0 ? 'rgba(0,200,122,.03)' : 'transparent',
                        fontSize: v === '✓' || v === '✗' ? '15px' : '12px',
                      }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(232,234,240,.3)', marginTop: '10px', textAlign: 'center' }}>
            * Semáforo do Profit funciona apenas com a plataforma aberta e vinculado à corretora.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="lp-section">
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#00c87a', textTransform: 'uppercase' }}>
            Como funciona
          </span>
          <h2 className="lp-h2" style={{ fontWeight: 800, margin: '12px 0 48px', letterSpacing: '-1px' }}>
            Configure uma vez, use todos os dias
          </h2>

          <div className="lp-steps" style={{ display: 'grid', gap: '0' }}>
            {[
              { n: '01', title: 'Configure seu plano de risco', desc: 'Defina risco por operação, limite de perda diária, janela de operação e metas. Leva menos de 5 minutos.' },
              { n: '02', title: 'Consulte antes de operar', desc: 'Pelo celular ou computador, verifique o semáforo e o plano antes de abrir qualquer posição.' },
              { n: '03', title: 'Lance e acompanhe os resultados', desc: 'Registre cada trade. O sistema calcula resultado, drawdown, DARF e atualiza tudo em tempo real.' },
            ].map((step) => (
              <div key={step.n} className="lp-step" style={{ padding: '32px 28px', position: 'relative' }}>
                <div style={{ fontSize: '48px', fontWeight: 900, color: 'rgba(0,200,122,.12)', lineHeight: 1, marginBottom: '16px' }}>{step.n}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: '#e8eaf0' }}>{step.title}</div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(232,234,240,.55)' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="lp-section" style={{ background: '#0c0f17', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#00c87a', textTransform: 'uppercase' }}>
              Planos
            </span>
            <h2 className="lp-h2" style={{ fontWeight: 800, margin: '12px 0 12px', letterSpacing: '-1px' }}>
              Escolha o seu plano
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(232,234,240,.5)' }}>
              Sem taxa de setup. Sem contrato de fidelidade. Cancele quando quiser.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>

            {/* MENSAL */}
            <div style={{ borderRadius: '16px', padding: '28px', background: '#10141e', border: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(232,234,240,.45)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Mensal</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', color: 'rgba(232,234,240,.45)', fontWeight: 600 }}>R$</span>
                <span style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-2px', color: '#e8eaf0' }}>52</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#e8eaf0' }}>,90</span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(232,234,240,.4)', marginBottom: '24px' }}>por mês · cobrado mensalmente</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Acesso completo ao sistema', 'Semáforo de janela', 'Multi-conta', 'DARF automático', 'Import de PDF de corretagem', 'Suporte por WhatsApp'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(232,234,240,.7)' }}>
                    <span style={{ color: '#00c87a', fontWeight: 700, flexShrink: 0 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <a href={KIWIFY_MENSAL} style={{
                display: 'block', textAlign: 'center', padding: '13px',
                borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                background: 'rgba(255,255,255,.07)', color: '#e8eaf0',
                border: '1px solid rgba(255,255,255,.12)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.07)'}
              >Assinar mensal</a>
            </div>

            {/* SEMESTRAL */}
            <div style={{
              borderRadius: '16px', padding: '28px',
              background: 'linear-gradient(135deg, rgba(0,200,122,.08) 0%, rgba(10,15,25,1) 60%)',
              border: '1px solid rgba(0,200,122,.35)',
              position: 'relative',
              boxShadow: '0 0 40px rgba(0,200,122,.08)',
            }}>
              <div style={{
                position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                background: '#00c87a', color: '#050709', fontSize: '11px', fontWeight: 800,
                padding: '4px 16px', borderRadius: '20px', letterSpacing: '.5px', whiteSpace: 'nowrap',
              }}>MAIS POPULAR</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#00c87a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Semestral</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: 'rgba(232,234,240,.6)', fontWeight: 600 }}>R$</span>
                <span style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-2px', color: '#e8eaf0' }}>44</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#e8eaf0' }}>,90</span>
                <span style={{ fontSize: '13px', color: 'rgba(232,234,240,.45)', marginLeft: '4px' }}>/mês</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(232,234,240,.4)' }}>R$ 269,40 · cobrado a cada 6 meses</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#00c87a', background: 'rgba(0,200,122,.12)', border: '1px solid rgba(0,200,122,.2)', borderRadius: '4px', padding: '2px 6px' }}>−15%</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Acesso completo ao sistema', 'Semáforo de janela', 'Multi-conta', 'DARF automático', 'Import de PDF de corretagem', 'Suporte por WhatsApp'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(232,234,240,.7)' }}>
                    <span style={{ color: '#00c87a', fontWeight: 700, flexShrink: 0 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <a href={KIWIFY_SEMESTRAL} style={{
                display: 'block', textAlign: 'center', padding: '13px',
                borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                background: '#00c87a', color: '#050709',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#00e889'}
                onMouseLeave={e => e.currentTarget.style.background = '#00c87a'}
              >Assinar semestral</a>
            </div>

            {/* ANUAL */}
            <div style={{ borderRadius: '16px', padding: '28px', background: '#10141e', border: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(232,234,240,.45)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Anual</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: 'rgba(232,234,240,.45)', fontWeight: 600 }}>R$</span>
                <span style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-2px', color: '#e8eaf0' }}>37</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#e8eaf0' }}>,90</span>
                <span style={{ fontSize: '13px', color: 'rgba(232,234,240,.45)', marginLeft: '4px' }}>/mês</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(232,234,240,.4)' }}>R$ 454,80 · cobrado anualmente</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#d4a843', background: 'rgba(212,168,67,.12)', border: '1px solid rgba(212,168,67,.25)', borderRadius: '4px', padding: '2px 6px' }}>−28%</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Acesso completo ao sistema', 'Semáforo de janela', 'Multi-conta', 'DARF automático', 'Import de PDF de corretagem', 'Suporte por WhatsApp'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(232,234,240,.7)' }}>
                    <span style={{ color: '#00c87a', fontWeight: 700, flexShrink: 0 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <a href={KIWIFY_ANUAL} style={{
                display: 'block', textAlign: 'center', padding: '13px',
                borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                background: 'rgba(255,255,255,.07)', color: '#e8eaf0',
                border: '1px solid rgba(255,255,255,.12)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.07)'}
              >Assinar anual</a>
            </div>
          </div>

          <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '13px', color: 'rgba(232,234,240,.4)' }}>
            Pagamento seguro via Kiwify · Cartão de crédito, Pix ou boleto · Cancele a qualquer momento
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-section" style={{
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(0,200,122,.04))',
        borderTop: '1px solid rgba(255,255,255,.05)',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <img src="/logo-shield.png" alt="GesRisk" width="56" height="56" style={{ borderRadius: '12px', marginBottom: '24px' }} />
          <h2 className="lp-h2" style={{ fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1px' }}>
            Pronto para parar de improvisar?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(232,234,240,.6)', margin: '0 0 36px', lineHeight: 1.6 }}>
            Consistência no trade começa com disciplina fora da plataforma.
            O GesRisk Trader é a ferramenta que faltava.
          </p>
          <button onClick={() => scrollTo('planos')} style={{
            padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
            background: '#00c87a', color: '#050709', border: 'none', cursor: 'pointer',
            transition: 'background .15s, transform .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00e889'; e.currentTarget.style.transform = 'scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#00c87a'; e.currentTarget.style.transform = 'none' }}
          >
            Ver planos e começar →
          </button>
          <div style={{ marginTop: '20px', fontSize: '12px', color: 'rgba(232,234,240,.3)' }}>
            Já tem acesso?{' '}
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'rgba(232,234,240,.55)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
              Entrar no sistema
            </button>
          </div>
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
          GesRisk Trader — Gestão de risco para day trader
        </div>
        <div>© {new Date().getFullYear()} Todos os direitos reservados</div>
      </footer>
    </div>
  )
}
