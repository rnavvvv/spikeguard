import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Activity, Server, AlertTriangle, CheckCircle, RefreshCw, Zap, Database, Layers, ExternalLink } from 'lucide-react'
import { getMetricsOverview, getMetricsSQS, getMetricsTraffic } from '../api'

const FUNCTION_COLORS = {
  OrderService: '#f59e0b',
  AuthService: '#60a5fa',
  InventoryService: '#34d399',
  MetricsService: '#a78bfa'
}

export default function Admin() {
  const [overview, setOverview] = useState(null)
  const [sqs, setSqs] = useState(null)
  const [traffic, setTraffic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFn, setSelectedFn] = useState('OrderService')

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [ovRes, sqsRes, trfRes] = await Promise.all([
        getMetricsOverview(),
        getMetricsSQS(),
        getMetricsTraffic()
      ])
      setOverview(ovRes.data)
      setSqs(sqsRes.data)
      setTraffic(trfRes.data)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Metrics fetch error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => fetchAll(true), 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const totalInvocations = overview
    ? Object.values(overview).reduce((s, fn) => s + fn.invocations, 0)
    : 0
  const totalErrors = overview
    ? Object.values(overview).reduce((s, fn) => s + fn.errors, 0)
    : 0
  const errorRate = totalInvocations > 0 ? ((totalErrors / totalInvocations) * 100).toFixed(1) : '0.0'

  const sqsTotal = sqs ? sqs.queued + sqs.processing : 0
  const spikeStatus = traffic && traffic.hourly?.length > 0
    ? (() => {
        const counts = traffic.hourly.map(h => h.requests)
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length || 0
        const current = counts[counts.length - 1] || 0
        if (current > avg * 2.5) return { label: 'SPIKE DETECTED', color: '#ef4444', icon: '🔴' }
        if (current > avg * 1.5) return { label: 'ELEVATED', color: '#f59e0b', icon: '🟡' }
        return { label: 'NORMAL', color: '#34d399', icon: '🟢' }
      })()
    : { label: 'NORMAL', color: '#34d399', icon: '🟢' }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <header style={{
        background: '#161616', borderBottom: '1px solid #2a2a2a',
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>SpikeGuard</span>
          <span style={{ fontSize: 11, background: '#2a2a2a', color: '#9ca3af', padding: '3px 8px', borderRadius: 4, marginLeft: 4 }}>ADMIN</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Spike Status Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#1a1a1a', border: `1px solid ${spikeStatus.color}40`,
            padding: '6px 14px', borderRadius: 20
          }}>
            <span style={{ fontSize: 12 }}>{spikeStatus.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: spikeStatus.color }}>{spikeStatus.label}</span>
          </div>

          <a href="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Customer Shop</a>

          <button onClick={() => fetchAll(true)} disabled={refreshing} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#2a2a2a', border: 'none', borderRadius: 8,
            padding: '7px 14px', color: '#e5e7eb', fontSize: 13, cursor: 'pointer'
          }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {lastUpdated && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <Zap size={32} color="#f59e0b" style={{ marginBottom: 12 }} />
            <p>Fetching CloudWatch metrics...</p>
          </div>
        </div>
      ) : (
        <main style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <KPICard title="Total Invocations (24h)" value={totalInvocations.toLocaleString()}
              icon={<Activity size={18} color="#60a5fa" />} color="#60a5fa" bg="#1a2332" />
            <KPICard title="Total Errors" value={totalErrors.toLocaleString()}
              icon={<AlertTriangle size={18} color="#f87171" />} color="#f87171" bg="#2a1a1a"
              sub={`${errorRate}% error rate`} />
            <KPICard title="SQS Queue Depth" value={sqsTotal.toString()}
              icon={<Layers size={18} color="#a78bfa" />} color="#a78bfa" bg="#1e1a2e"
              sub={`${sqs?.queued || 0} queued · ${sqs?.processing || 0} processing`} />
            <KPICard title="Traffic Status" value={spikeStatus.label}
              icon={<CheckCircle size={18} color={spikeStatus.color} />} color={spikeStatus.color} bg="#1a1a1a" />
          </div>

          {/* Traffic Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
            <Panel title="Order Traffic — Last 24h" subtitle="Hourly OrderService invocations">
              {traffic?.hourly?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={traffic.hourly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e7eb' }} />
                    <Area type="monotone" dataKey="requests" stroke="#f59e0b" fill="url(#trafficGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart msg="No traffic data yet — orders will appear here" />
              )}
            </Panel>

            {/* SQS Panel */}
            <Panel title="SQS Queue" subtitle="OrdersQueue live depth">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
                <SQSMeter label="Messages Queued" value={sqs?.queued || 0} color="#f59e0b" max={Math.max(100, (sqs?.queued || 0) * 2)} />
                <SQSMeter label="Being Processed" value={sqs?.processing || 0} color="#60a5fa" max={Math.max(100, (sqs?.processing || 0) * 2)} />
                <div style={{ background: '#1a1a1a', borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Queue behavior</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
                    During traffic spikes, Lambda auto-scales and SQS buffers overflow orders. Zero orders are lost.
                  </p>
                </div>
              </div>
            </Panel>
          </div>

          {/* Per-Function breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Panel title="Lambda Functions" subtitle="Select a function to inspect">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {overview && Object.entries(overview).map(([fn, data]) => (
                  <div key={fn} onClick={() => setSelectedFn(fn)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    background: selectedFn === fn ? '#1e1e1e' : 'transparent',
                    border: `1px solid ${selectedFn === fn ? FUNCTION_COLORS[fn] + '60' : '#2a2a2a'}`,
                    transition: 'all 0.15s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: FUNCTION_COLORS[fn] || '#6b7280' }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{fn}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#9ca3af' }}>
                      <span>{data.invocations} calls</span>
                      <span style={{ color: data.errors > 0 ? '#f87171' : '#34d399' }}>{data.errors} errors</span>
                      <span>{data.avg_duration}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title={`${selectedFn} — Hourly`} subtitle="Invocations per hour">
              {overview?.[selectedFn]?.hourly?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={overview[selectedFn].hourly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e7eb' }} />
                    <Bar dataKey="count" fill={FUNCTION_COLORS[selectedFn] || '#60a5fa'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart msg="No invocation data yet for this function" />
              )}
            </Panel>
          </div>

          {/* Gradio HF Space Link */}
          <Panel title="ML Spike Predictor" subtitle="Powered by Random Forest · Hosted on Hugging Face Spaces">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#1a1a1a', borderRadius: 10, padding: '20px 24px'
            }}>
              <div>
                <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 6, lineHeight: 1.6 }}>
                  The TrafficPredictor model runs on Hugging Face Spaces. It uses a trained Random Forest classifier
                  to predict traffic spikes before they hit — giving the system time to pre-warm Lambda and scale SQS capacity.
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <Tag label="Random Forest" color="#a78bfa" />
                  <Tag label="Gradio UI" color="#34d399" />
                  <Tag label="HF Spaces" color="#f59e0b" />
                </div>
              </div>
              <a href="https://huggingface.co/spaces/ArnavChaturvedi1503/spikeguard" target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#2a2a2a', border: '1px solid #3a3a3a',
                padding: '12px 20px', borderRadius: 10, color: '#e5e7eb',
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                whiteSpace: 'nowrap', marginLeft: 24
              }}>
                Open Predictor <ExternalLink size={14} />
              </a>
            </div>
          </Panel>

        </main>
      )}
    </div>
  )
}

function KPICard({ title, value, icon, color, bg, sub }) {
  return (
    <div style={{ background: bg || '#161616', border: `1px solid ${color}20`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</p>
        {icon}
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color, marginBottom: sub ? 4 : 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#6b7280' }}>{sub}</p>}
    </div>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: '#6b7280' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function SQSMeter({ label, value, color, max }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: '#2a2a2a', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

function EmptyChart({ msg }) {
  return (
    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
      <Server size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
      <p style={{ fontSize: 13 }}>{msg}</p>
    </div>
  )
}

function Tag({ label, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
      background: color + '20', color
    }}>{label}</span>
  )
}
