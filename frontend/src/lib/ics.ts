export function buildICS(
  title: string,
  startISO: string,
  endISO: string,
  location?: string
) {
  const dt = (s: string) => s.replaceAll('-', '').replaceAll(':', '').replace('.000Z','').replace('.000','').replace('Z','Z')
  const uid = `${Date.now()}@randomtrip`
  const body =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Randomtrip//ES
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dt(new Date().toISOString())}
DTSTART:${dt(startISO)}
DTEND:${dt(endISO)}
SUMMARY:${title}
LOCATION:${location || ''}
END:VEVENT
END:VCALENDAR`
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body)
}
