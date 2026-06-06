import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts'

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value
  return (
    <div className="ct">
      {`$${Number(value || 0).toLocaleString('en', { maximumFractionDigits: 0 })}`}
    </div>
  )
}

export default function EquityAreaChart({ width, height, data, accentColor, mutedColor }) {
  return (
    <AreaChart width={width} height={height} data={data} margin={{ top: 4, right: 46, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="equity-area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={accentColor} stopOpacity={0.22} />
          <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="i" hide />
      <YAxis
        orientation="right"
        tickLine={false}
        axisLine={false}
        tick={{ fill: mutedColor, fontSize: 9, fontFamily: 'JetBrains Mono' }}
        tickFormatter={(value) => `$${Math.round(value / 1000)}K`}
        domain={['auto', 'auto']}
      />
      <RechartsTooltip content={<ChartTooltip />} />
      <Area type="monotone" dataKey="v" stroke={accentColor} strokeWidth={1.5} fill="url(#equity-area-gradient)" dot={false} />
    </AreaChart>
  )
}
