import ical from 'node-ical'

// Recomputa como mucho cada 5 min: refresca el ICS y la ventana de fechas
// sin pegarle a Google en cada reapertura del panel.
export const revalidate = 300

type AgendaEvent = {
  id: string
  title: string
  start: string   // ISO
  end: string     // ISO
  allDay: boolean
}

const DAYS_AHEAD = 7

// summary puede venir como string o como { val, params }.
function asText(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && 'val' in v) return String((v as { val: unknown }).val)
  return ''
}

export async function GET() {
  const url = process.env.GOOGLE_CALENDAR_ICS_URL

  if (!url) {
    return Response.json({ events: [], configured: false })
  }

  try {
    // fetch server-side (evita CORS y mantiene la URL secreta fuera del cliente)
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) {
      return Response.json({ events: [], configured: true, error: 'fetch_failed' }, { status: 502 })
    }
    const text = await res.text()
    const data = ical.sync.parseICS(text)

    const now = new Date()
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const windowEnd = new Date(windowStart)
    windowEnd.setDate(windowEnd.getDate() + DAYS_AHEAD)

    const events: AgendaEvent[] = []

    for (const key of Object.keys(data)) {
      const ev = data[key]
      if (!ev || ev.type !== 'VEVENT') continue
      const vev = ev as ical.VEvent
      if (!vev.start || !vev.end) continue
      const title = asText(vev.summary) || '(sin título)'
      const allDay = vev.datetype === 'date'
      const durationMs = vev.end.getTime() - vev.start.getTime()

      if (vev.rrule) {
        // Evento recurrente: expandir ocurrencias dentro de la ventana.
        const exdates = vev.exdate ? Object.keys(vev.exdate) : []
        const occurrences = vev.rrule.between(windowStart, windowEnd, true)
        for (const occ of occurrences) {
          const dateKey = occ.toISOString().slice(0, 10)
          if (exdates.some(d => d.slice(0, 10) === dateKey)) continue
          const start = occ
          const end = new Date(start.getTime() + durationMs)
          events.push({
            id: `${key}-${start.toISOString()}`,
            title, allDay,
            start: start.toISOString(),
            end: end.toISOString(),
          })
        }
      } else {
        // Evento simple: incluir si solapa la ventana.
        if (vev.end >= windowStart && vev.start < windowEnd) {
          events.push({
            id: key,
            title, allDay,
            start: vev.start.toISOString(),
            end: vev.end.toISOString(),
          })
        }
      }
    }

    events.sort((a, b) => a.start.localeCompare(b.start))
    return Response.json({ events, configured: true })
  } catch (err) {
    console.error('[api/calendar]', err)
    return Response.json({ events: [], configured: true, error: 'parse_failed' }, { status: 500 })
  }
}
