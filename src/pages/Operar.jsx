import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import { api } from '../lib/api'

// ─── Utils ──────────────────────────────────────────────────────────────────
function R(v) {
  const abs = Math.abs(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (v < 0 ? '−' : '') + 'R$ ' + abs
}
function N(v, d = 0) { return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) }

const TICK  = { WIN: 0.20, WDO: 10.0 }
const CUSTO = { WIN: 0.15, WDO: 1.50 } // round-trip por contrato

function calcSizing(conta) {
  const capital  = parseFloat(conta.capital_disponivel) || 0
  const riscoPct = parseFloat(conta.risco_pct) || 1
  const riscoR   = capital * (riscoPct / 100)
  const inst     = (conta.instrumento || 'WIN').toUpperCase()

  function bloco(ativo) {
    const stopPts  = ativo === 'WIN' ? (parseInt(conta.stop_pts_win) || 200) : (parseInt(conta.stop_pts_wdo) || 80)
    const tick     = TICK[ativo]
    const custo1ct = CUSTO[ativo]
    const stopR1   = stopPts * tick
    const cts      = stopR1 > 0 ? Math.max(1, Math.floor(riscoR / stopR1)) : 1
    const stopR    = cts * stopR1
    const custoRT  = cts * custo1ct
    const bePts    = Math.ceil(custoRT / (tick * cts))
    const alvo1_2  = stopPts * 2
    const alvoR    = alvo1_2 * tick * cts
    const rr12     = (alvoR / stopR).toFixed(2)
    const custoRatioStop = stopR > 0 ? (custoRT / stopR * 100).toFixed(1) : '0'
    return { stopPts, cts, stopR, custoRT, bePts, alvo1_2, alvoR, rr12, custoRatioStop }
  }

  return {
    capital, riscoPct, riscoR, inst,
    mostrarWin: inst === 'WIN' || inst === 'AMBOS',
    mostrarWdo: inst === 'WDO' || inst === 'AMBOS',
    win: bloco('WIN'),
    wdo: bloco('WDO'),
  }
}

// ─── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, color, sub, bold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '12px', color: 'var(--txt3)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: bold ? '15px' : '13px',
          fontWeight: bold ? 800 : 600, color: color || 'var(--txt)',
        }}>{value}</span>
        {sub && <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '1px' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── BlocoAtivo ─────────────────────────────────────────────────────────────
function BlocoAtivo({ ativo, b, metaDia, stopDia }) {
  const isWin   = ativo === 'WIN'
  const accent  = isWin ? '#5ba4f5' : '#d4a843'
  const accentB = isWin ? 'rgba(91,164,245,.12)' : 'rgba(212,168,67,.12)'
  const accentBd = isWin ? 'rgba(91,164,245,.25)' : 'rgba(212,168,67,.3)'

  const opsParaMeta = metaDia > 0 && b.alvoR > 0 ? Math.ceil(metaDia / b.alvoR) : null
  const opsAtéStop  = stopDia > 0 && b.stopR > 0 ? Math.floor(stopDia / b.stopR) : null

  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${accentBd}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: accentB, borderBottom: `1px solid ${accentBd}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px', fontWeight: 900, color: accent, fontFamily: "'JetBrains Mono',monospace" }}>{ativo}</span>
        <span style={{ fontSize: '10px', color: accent, opacity: .8 }}>{isWin ? 'R$ 0,20/pt · Mini Índice' : 'R$ 10,00/pt · Mini Dólar'}</span>
        <div style={{ marginLeft: 'auto', background: accent, color: '#000', fontWeight: 900, fontSize: '18px', fontFamily: "'JetBrains Mono',monospace", padding: '2px 12px', borderRadius: '6px' }}>
          {b.cts} ct
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {/* Stop */}
        <div style={{ background: 'rgba(255,69,96,.07)', border: '1px solid rgba(255,69,96,.2)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Stop / op</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '22px', fontWeight: 800, color: 'var(--red)' }}>{N(b.stopPts)} pts</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: 'var(--red)', marginTop: '3px' }}>{R(-b.stopR)}</div>
          {opsAtéStop && <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '4px' }}>{opsAtéStop} ops até stop dia</div>}
        </div>

        {/* Alvo 1:2 */}
        <div style={{ background: 'rgba(76,175,130,.07)', border: '1px solid rgba(76,175,130,.2)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Alvo 1:2</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '22px', fontWeight: 800, color: 'var(--green)' }}>{N(b.alvo1_2)} pts</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: 'var(--green)', marginTop: '3px' }}>{R(b.alvoR)}</div>
          {opsParaMeta && <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '4px' }}>{opsParaMeta} ops p/ meta dia</div>}
        </div>

        {/* R/R */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Risco / Retorno</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '28px', fontWeight: 900,
            color: parseFloat(b.rr12) >= 2 ? 'var(--green)' : parseFloat(b.rr12) >= 1.5 ? 'var(--gold)' : 'var(--yellow)',
          }}>{b.rr12}:1</div>
          <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '3px' }}>alvo/stop</div>
        </div>
      </div>

      {/* Custos B3 */}
      <div style={{ margin: '0 16px 12px', background: 'rgba(255,193,77,.06)', border: '1px solid rgba(255,193,77,.2)', borderRadius: '8px', padding: '10px 14px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Custos B3 por operação (round-trip)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { lbl: 'Taxa total', val: R(b.custoRT) },
            { lbl: 'Break-even', val: `${b.bePts} pts`, sub: 'pontos mínimos p/ cobrir custo' },
            { lbl: '% do stop', val: `${b.custoRatioStop}%`, sub: 'do risk por custo B3' },
          ].map(({ lbl, val, sub }) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: 'var(--txt3)', marginBottom: '3px' }}>{lbl}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', fontWeight: 700, color: 'var(--yellow)' }}>{val}</div>
              {sub && <div style={{ fontSize: '9px', color: 'var(--txt3)', marginTop: '2px', lineHeight: 1.4 }}>{sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Fórmula explicada */}
      <div style={{ margin: '0 16px 14px', fontSize: '11px', color: 'var(--txt3)', lineHeight: 1.7, background: 'var(--bg3)', borderRadius: '7px', padding: '10px 12px' }}>
        <span style={{ color: accent, fontWeight: 700 }}>Como chegamos em {b.cts} ct: </span>
        Risco/op = capital × {b.stopPts > 0 ? b.cts : '…'} = {R(b.stopR < 0 ? -b.stopR : b.stopR > 0 ? b.stopR : 0)} · Stop {b.stopPts} pts × R${isWin ? '0,20' : '10,00'}/pt × {b.cts}ct = {R(b.stopR)}
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Operar() {
  const [contas,    setContas]    = useState([])
  const [dashboard, setDashboard] = useState([])
  const [contaId,   setContaId]   = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([api.get('contas'), api.get('dashboard')])
      .then(([cs, ds]) => {
        const ativas = (cs || []).filter(c => c.ativa != 0)
        setContas(ativas)
        setDashboard(Array.isArray(ds) ? ds : [])
        if (ativas.length) setContaId(ativas[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  const conta   = contas.find(c => +c.id === +contaId)
  const dash    = dashboard.find(d => +d.id === +contaId)
  const sizing  = conta ? calcSizing(conta) : null

  if (loading) return (
    <>
      <Nav />
      <main style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--txt3)' }}>Carregando…</main>
    </>
  )

  if (!contas.length) return (
    <>
      <Nav />
      <main style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
        <p style={{ color: 'var(--txt3)' }}>Crie uma conta em <strong style={{ color: 'var(--gold)' }}>Config</strong> para ver o briefing.</p>
      </main>
    </>
  )

  return (
    <>
      <Nav />
      <main style={{ padding: '20px 24px', maxWidth: '860px', margin: '0 auto' }}>

        {/* Título */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: '4px' }}>Briefing de Sessão</div>
          <div style={{ fontSize: '18px', fontWeight: 800 }}>Plano do Pregão</div>
          <div style={{ fontSize: '12px', color: 'var(--txt3)', marginTop: '3px' }}>Contratos, stops e metas calculados a partir do capital e risco configurados.</div>
        </div>

        {/* Seletor de conta */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {contas.map(c => (
            <button key={c.id} onClick={() => setContaId(c.id)} style={{
              padding: '7px 16px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: '.2s',
              background: +contaId === +c.id ? 'var(--gold-bg)' : 'var(--bg2)',
              color: +contaId === +c.id ? 'var(--gold)' : 'var(--txt2)',
              border: `1px solid ${+contaId === +c.id ? 'var(--gold-bd)' : 'var(--border2)'}`,
            }}>{c.nome}</button>
          ))}
        </div>

        {conta && sizing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Aviso: capital não preenchido */}
            {!parseFloat(conta.capital_disponivel) && (
              <div style={{ padding: '14px 18px', background: 'rgba(212,168,67,.1)', border: '1px solid rgba(212,168,67,.3)', borderRadius: '10px', fontSize: '13px', color: 'var(--yellow)' }}>
                ⚠ Preencha o <strong>Capital Disponível</strong> em Config → Editar para ver o sizing calculado.
              </div>
            )}

            {/* Card: Resumo da conta */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: '14px' }}>Parâmetros da Conta</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {[
                  { lbl: 'Capital Disponível', val: R(sizing.capital), col: 'var(--txt)', big: true },
                  { lbl: 'Risco por Op',        val: `${N(sizing.riscoPct, 1)}%  =  ${R(sizing.riscoR)}`, col: 'var(--gold)' },
                  { lbl: 'Meta Diária',          val: R(conta.meta_diaria || 0), col: 'var(--green)' },
                  { lbl: 'Stop Diário',          val: R(conta.stop_diario || 0), col: 'var(--red)' },
                  { lbl: 'Meta Mensal',          val: R(conta.meta_mensal || 0), col: 'var(--green)' },
                  { lbl: 'Instrumento',          val: conta.instrumento || 'WIN', col: 'var(--txt)' },
                ].map(({ lbl, val, col, big }) => (
                  <div key={lbl} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px' }}>{lbl}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: big ? '16px' : '13px', fontWeight: 700, color: col }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resultado de hoje */}
            {dash && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: '14px' }}>Posição de Hoje</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { lbl: 'Resultado Hoje', val: R(dash.lucro_hoje || 0), col: (dash.lucro_hoje || 0) > 0 ? 'var(--green)' : (dash.lucro_hoje || 0) < 0 ? 'var(--red)' : 'var(--txt2)' },
                    { lbl: `Ciclo · ${dash.periodo_label || 'mês'}`, val: R(dash.lucro_ciclo || 0), col: (dash.lucro_ciclo || 0) >= 0 ? 'var(--green)' : 'var(--red)' },
                    { lbl: 'Status',           val: dash.status_dia || 'Livre', col: dash.status_dia === 'META_DIA' ? 'var(--green)' : dash.status_dia === 'STOP_DIA' ? 'var(--red)' : 'var(--txt2)' },
                    { lbl: 'Ops Hoje',         val: String(dash.ops_hoje || 0), col: 'var(--txt)' },
                  ].map(({ lbl, val, col }) => (
                    <div key={lbl} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px' }}>{lbl}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '14px', fontWeight: 700, color: col }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculadora de sizing */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Calculadora de Contratos
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Lógica explicada */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px', fontSize: '12px', color: 'var(--txt2)', lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--gold)' }}>Como é calculado:</strong>{' '}
                Nº de contratos = <span style={{ color: 'var(--txt)', fontFamily: "'JetBrains Mono',monospace" }}>capital × risco% ÷ (stop_pts × valor_ponto)</span>.
                {' '}Com capital {R(sizing.capital)} e risco {N(sizing.riscoPct, 1)}%, o máximo de perda por operação é{' '}
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{R(sizing.riscoR)}</span>.
                {' '}Os contratos são arredondados para baixo (nunca acima do risco definido).
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sizing.mostrarWin && (
                  <BlocoAtivo ativo="WIN" b={sizing.win} metaDia={conta.meta_diaria || 0} stopDia={conta.stop_diario || 0} />
                )}
                {sizing.mostrarWdo && (
                  <BlocoAtivo ativo="WDO" b={sizing.wdo} metaDia={conta.meta_diaria || 0} stopDia={conta.stop_diario || 0} />
                )}
              </div>
            </div>

            {/* Plano de metas */}
            {(conta.meta_diaria > 0 || conta.meta_mensal > 0) && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: '14px' }}>Plano de Metas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {sizing.mostrarWin && conta.meta_diaria > 0 && (
                    <InfoRow
                      label={`WIN — ops p/ bater meta dia (1:2 RR)`}
                      value={`${Math.ceil((conta.meta_diaria || 0) / sizing.win.alvoR)} ops`}
                      color="var(--green)"
                      sub={`${Math.ceil((conta.meta_diaria || 0) / sizing.win.alvoR)} × ${R(sizing.win.alvoR)} = ${R(Math.ceil((conta.meta_diaria||0)/sizing.win.alvoR)*sizing.win.alvoR)}`}
                    />
                  )}
                  {sizing.mostrarWdo && conta.meta_diaria > 0 && (
                    <InfoRow
                      label={`WDO — ops p/ bater meta dia (1:2 RR)`}
                      value={`${Math.ceil((conta.meta_diaria || 0) / sizing.wdo.alvoR)} ops`}
                      color="var(--green)"
                      sub={`${Math.ceil((conta.meta_diaria || 0) / sizing.wdo.alvoR)} × ${R(sizing.wdo.alvoR)} = ${R(Math.ceil((conta.meta_diaria||0)/sizing.wdo.alvoR)*sizing.wdo.alvoR)}`}
                    />
                  )}
                  {conta.meta_mensal > 0 && conta.meta_diaria > 0 && (
                    <InfoRow
                      label="Dias de meta p/ fechar mês"
                      value={`${Math.ceil((conta.meta_mensal || 0) / (conta.meta_diaria || 1))} dias`}
                      color="var(--gold)"
                      sub={`assumindo 1 meta/dia de ${R(conta.meta_diaria)}`}
                    />
                  )}
                  {conta.stop_diario > 0 && sizing.mostrarWin && (
                    <InfoRow
                      label="WIN — ops até stop diário"
                      value={`${Math.floor((conta.stop_diario || 0) / sizing.win.stopR)} ops`}
                      color="var(--red)"
                      sub={`${Math.floor((conta.stop_diario||0)/sizing.win.stopR)} × ${R(sizing.win.stopR)} = stop`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Taxa de acerto necessária */}
            {sizing && (sizing.mostrarWin || sizing.mostrarWdo) && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: '14px' }}>Taxa de Acerto Mínima para ser Lucrativo</div>
                <div style={{ fontSize: '12px', color: 'var(--txt2)', lineHeight: 1.9 }}>
                  {(['WIN','WDO']).filter(a => sizing[a === 'WIN' ? 'mostrarWin' : 'mostrarWdo']).map(ativo => {
                    const b = sizing[ativo.toLowerCase()]
                    const rr = parseFloat(b.rr12)
                    const taxMin = (1 / (1 + rr) * 100).toFixed(0)
                    return (
                      <div key={ativo} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px' }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: '14px', color: ativo === 'WIN' ? '#5ba4f5' : 'var(--gold)', minWidth: '40px' }}>{ativo}</span>
                        <span style={{ fontSize: '12px', color: 'var(--txt2)', flex: 1 }}>
                          Com R/R {b.rr12}:1, o ponto de equilíbrio é{' '}
                          <strong style={{ color: parseFloat(taxMin) <= 35 ? 'var(--green)' : parseFloat(taxMin) <= 45 ? 'var(--yellow)' : 'var(--red)' }}>{taxMin}% de acerto</strong>
                          {' '}— abaixo disso você perde dinheiro consistentemente.
                          {parseFloat(taxMin) <= 35 && ' ✓ Excelente R/R.'}
                          {parseFloat(taxMin) > 35 && parseFloat(taxMin) <= 45 && ' Bom R/R.'}
                        </span>
                      </div>
                    )
                  })}
                  <div style={{ fontSize: '11px', color: 'var(--txt3)', marginTop: '4px', lineHeight: 1.6 }}>
                    Fórmula: Ponto de equilíbrio = 1 ÷ (1 + R/R). Stop em 200 pts e alvo em 400 pts (1:2) exige apenas <strong style={{ color: 'var(--green)' }}>33% de acerto</strong> para ser lucrativo (antes dos custos).
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </>
  )
}
