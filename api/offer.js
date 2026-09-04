import nodemailer from 'nodemailer'

const FROM_DEFAULT = 'Stalder Schwimmbadtechnik <noreply@stalder-pool.ch>'
const TO_DEFAULT = 'info@stalder-pool.ch'
const SMTP_HOST_DEFAULT = 'smtp.office365.com'
const SMTP_USER_DEFAULT = 'noreply@stalder-pool.ch'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_MESSAGE = 4000

function envVal(env, key, fallback = '') {
  const v = env?.[key]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatCHF(value) {
  const n = Math.round(Number(value) || 0)
  return `CHF ${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`
}

function clip(value, max) {
  return String(value ?? '').trim().slice(0, max)
}

function formatDims(length, width, depth) {
  const m = (v) => Number(v).toFixed(1).replace('.', ',')
  return `${m(length)} × ${m(width)} × ${m(depth)} m`
}

export function parseOfferPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Ungültige Anfrage.' }
  }

  if (clip(raw.website, 200)) {
    return { honeypot: true }
  }

  const leadIn = raw.lead && typeof raw.lead === 'object' ? raw.lead : {}
  const configIn = raw.config && typeof raw.config === 'object' ? raw.config : {}

  const lead = {
    firstName: clip(leadIn.firstName, 80),
    lastName: clip(leadIn.lastName, 80),
    phone: clip(leadIn.phone, 40),
    email: clip(leadIn.email, 120).toLowerCase(),
    zip: clip(leadIn.zip, 12),
    city: clip(leadIn.city, 80),
    wishMonth: clip(leadIn.wishMonth, 20),
    wishYear: clip(leadIn.wishYear, 6),
    poolSite: clip(leadIn.poolSite, 40),
    gardenWork: clip(leadIn.gardenWork, 40),
    gartenbauer: clip(leadIn.gartenbauer, 120),
    message: clip(leadIn.message, MAX_MESSAGE),
  }

  if (!lead.firstName || !lead.lastName || !lead.email) {
    return { error: 'Bitte Name und E-Mail ausfüllen.' }
  }
  if (!EMAIL_RE.test(lead.email)) {
    return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }
  }
  if (!lead.wishMonth || !lead.wishYear) {
    return { error: 'Bitte gewünschten Zeitraum angeben.' }
  }
  if (!['eben', 'hanglage', 'freistehend'].includes(lead.poolSite)) {
    return { error: 'Bitte angeben, wo das Becken stehen soll.' }
  }
  if (!['gesamtloesung', 'gartenbauer'].includes(lead.gardenWork)) {
    return { error: 'Bitte angeben, wie die Gartenbau-Arbeiten umgesetzt werden sollen.' }
  }
  if (lead.gardenWork === 'gartenbauer' && !lead.gartenbauer) {
    return { error: 'Bitte den Gartenbauer angeben.' }
  }

  const year = Number(lead.wishYear)
  const thisYear = new Date().getFullYear()
  if (!Number.isFinite(year) || year < thisYear || year > thisYear + 8) {
    return { error: 'Bitte ein gültiges Jahr wählen.' }
  }

  const linesIn = Array.isArray(configIn.lines) ? configIn.lines.slice(0, 40) : []
  const lines = linesIn.map((line) => ({
    label: clip(line?.label, 160) || 'Position',
    price: Math.max(0, Math.min(2_000_000, Number(line?.price) || 0)),
  }))

  const length = Number(configIn.length)
  const width = Number(configIn.width)
  const depth = Number(configIn.depth)

  const config = {
    type: clip(configIn.type, 40),
    poolSystem: clip(configIn.poolSystem, 40),
    length: Number.isFinite(length) ? length : 0,
    width: Number.isFinite(width) ? width : 0,
    depth: Number.isFinite(depth) ? depth : 0,
    color: clip(configIn.color, 80),
    lines,
    price: Math.max(0, Math.min(2_000_000, Number(configIn.price) || 0)),
  }

  return { lead, config }
}

function linesTable(lines) {
  const rows = lines
    .map(
      (line) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eaeaea;color:#191923;font-size:14px;">${escapeHtml(line.label)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eaeaea;color:#191923;font-size:14px;text-align:right;white-space:nowrap;">${escapeHtml(formatCHF(line.price))}</td>
        </tr>`,
    )
    .join('')
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
    </table>`
}

function wrapEmail({ kicker, title, intro, body, footer }) {
  return `<!DOCTYPE html>
<html lang="de">
<body style="margin:0;padding:0;background:#f4f3f0;font-family:Mulish,'Helvetica Neue',Arial,sans-serif;color:#191923;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fefefe;border:1px solid #eaeaea;">
          <tr>
            <td style="padding:28px 32px 16px;border-bottom:2px solid #191923;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#96917E;font-weight:700;">${escapeHtml(kicker)}</div>
              <div style="margin-top:8px;font-size:22px;font-weight:700;color:#191923;">${escapeHtml(title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;font-size:15px;line-height:1.55;color:#191923;">${intro}</td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">${body}</td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #eaeaea;font-size:12px;line-height:1.5;color:#5e5e5e;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function dlRow(label, value) {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:6px 0;color:#5e5e5e;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:#191923;font-size:14px;">${escapeHtml(value)}</td>
    </tr>`
}

const SITE_LABELS = {
  eben: 'Ebenes Gelände',
  hanglage: 'Hanglage',
  freistehend: 'Freistehend',
}

const GARDEN_LABELS = {
  gesamtloesung: 'interessiert an einer Gesamtlösung',
  gartenbauer: 'einen bestimmten Gartenbauer nach Möglichkeit berücksichtigen',
}

function buildInternalEmail(lead, config) {
  const dims = formatDims(config.length, config.width, config.depth)
  const name = `${lead.firstName} ${lead.lastName}`
  const system = config.poolSystem === 'Ueberlauf' ? 'Überlauf' : config.poolSystem || '—'
  const garden = GARDEN_LABELS[lead.gardenWork] || lead.gardenWork
  const site = SITE_LABELS[lead.poolSite] || lead.poolSite
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${dlRow('Name', name)}
      ${dlRow('E-Mail', lead.email)}
      ${dlRow('Telefon', lead.phone)}
      ${dlRow('PLZ', lead.zip)}
      ${dlRow('Stadt', lead.city)}
      ${dlRow('Wunschtermin', `${lead.wishMonth} ${lead.wishYear}`)}
      ${dlRow('Standort', site)}
      ${dlRow('Gartenbau', garden)}
      ${dlRow('Gartenbauer', lead.gartenbauer)}
      ${dlRow('Nachricht', lead.message)}
    </table>
    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#96917E;font-weight:700;margin:8px 0 12px;">Konfiguration</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${dlRow('Material', config.type)}
      ${dlRow('Poolart', system)}
      ${dlRow('Masse', dims)}
      ${dlRow('Farbe', config.color)}
    </table>
    ${linesTable(config.lines)}
    <div style="margin-top:16px;padding-top:12px;border-top:2px solid #191923;font-size:16px;font-weight:700;">
      Richtpreis ${escapeHtml(formatCHF(config.price))} <span style="font-weight:400;font-size:12px;color:#5e5e5e;">exkl. MwSt., Montage und Transport</span>
    </div>`

  return {
    subject: `Neue Offerte-Anfrage: ${name} — ${dims}`,
    text: [
      `Neue Offerte-Anfrage von ${name}`,
      `E-Mail: ${lead.email}`,
      lead.phone ? `Telefon: ${lead.phone}` : '',
      lead.zip ? `PLZ: ${lead.zip}` : '',
      lead.city ? `Stadt: ${lead.city}` : '',
      `Wunschtermin: ${lead.wishMonth} ${lead.wishYear}`,
      site ? `Standort: ${site}` : '',
      garden ? `Gartenbau: ${garden}` : '',
      lead.gartenbauer ? `Gartenbauer: ${lead.gartenbauer}` : '',
      lead.message ? `Nachricht: ${lead.message}` : '',
      '',
      `${config.type} ${system} ${dims}`,
      config.color ? `Farbe: ${config.color}` : '',
      ...config.lines.map((l) => `- ${l.label}: ${formatCHF(l.price)}`),
      `Richtpreis: ${formatCHF(config.price)} exkl. MwSt.`,
    ]
      .filter(Boolean)
      .join('\n'),
    html: wrapEmail({
      kicker: 'Pool-Konfigurator',
      title: 'Neue Offerte-Anfrage',
      intro: `Antworten Sie direkt auf diese E-Mail, um ${escapeHtml(name)} zu kontaktieren.`,
      body,
      footer: 'Automatisch gesendet vom 3D-Konfigurator. Preise gemäss Stalder-Preisliste.',
    }),
  }
}

function buildCustomerEmail(lead, config) {
  const dims = formatDims(config.length, config.width, config.depth)
  const system = config.poolSystem === 'Ueberlauf' ? 'Überlauf' : config.poolSystem || '—'
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${dlRow('Wunschtermin', `${lead.wishMonth} ${lead.wishYear}`)}
      ${dlRow('Material', config.type)}
      ${dlRow('Poolart', system)}
      ${dlRow('Masse', dims)}
      ${dlRow('Farbe', config.color)}
    </table>
    ${linesTable(config.lines)}
    <div style="margin-top:16px;padding-top:12px;border-top:2px solid #191923;font-size:16px;font-weight:700;">
      Richtpreis ${escapeHtml(formatCHF(config.price))}
    </div>
    <p style="margin:10px 0 0;font-size:12px;color:#5e5e5e;">exkl. MwSt., Montage und Transport. Die verbindliche Offerte folgt persönlich.</p>`

  return {
    subject: 'Ihre Anfrage bei Stalder Schwimmbadtechnik',
    text: [
      `Guten Tag ${lead.firstName}`,
      '',
      'Vielen Dank für Ihre Anfrage. Wir haben Ihre Pool-Konfiguration erhalten und melden uns in Kürze persönlich bei Ihnen.',
      '',
      `Wunschtermin: ${lead.wishMonth} ${lead.wishYear}`,
      `${config.type} ${system} ${dims}`,
      `Richtpreis: ${formatCHF(config.price)} exkl. MwSt.`,
      '',
      'Stalder Schwimmbadtechnik',
      '+41 71 393 62 62',
      'info@stalder-pool.ch',
      'https://www.stalder-pool.ch',
    ].join('\n'),
    html: wrapEmail({
      kicker: 'Stalder Schwimmbadtechnik',
      title: `Vielen Dank, ${lead.firstName}`,
      intro: 'Wir haben Ihre Pool-Konfiguration erhalten und melden uns in Kürze persönlich bei Ihnen.',
      body,
      footer:
        'Stalder Schwimmbadtechnik · +41 71 393 62 62 · <a href="mailto:info@stalder-pool.ch" style="color:#191923;">info@stalder-pool.ch</a><br>Ihre Daten werden vertraulich behandelt.',
    }),
  }
}

function smtpOptions(env) {
  const port = Number(envVal(env, 'SMTP_PORT', '587'))
  const secure = envVal(env, 'SMTP_SECURE', port === 465 ? 'true' : 'false') === 'true'
  return {
    host: envVal(env, 'SMTP_HOST', SMTP_HOST_DEFAULT),
    port,
    secure,
    requireTLS: !secure,
    auth: {
      user: envVal(env, 'SMTP_USER', SMTP_USER_DEFAULT),
      pass: envVal(env, 'SMTP_PASS'),
    },
  }
}

function createMailer(env) {
  return nodemailer.createTransport(smtpOptions(env))
}

async function sendMail(mailer, message) {
  await mailer.sendMail(message)
}

export async function processOfferRequest(raw, env = process.env) {
  const parsed = parseOfferPayload(raw)
  if (parsed.honeypot) return { status: 200, body: { ok: true } }
  if (parsed.error) return { status: 400, body: { error: parsed.error } }

  const smtp = smtpOptions(env)
  if (!smtp.auth.pass) {
    console.error('[offer] SMTP_PASS is missing')
    return {
      status: 503,
      body: { error: 'Die Offerte-Anfrage ist momentan nicht verfügbar. Bitte rufen Sie uns an: +41 71 393 62 62.' },
    }
  }

  const from = envVal(env, 'OFFER_FROM', FROM_DEFAULT)
  const to = envVal(env, 'OFFER_TO', TO_DEFAULT)
  const { lead, config } = parsed
  const internal = buildInternalEmail(lead, config)
  const customer = buildCustomerEmail(lead, config)
  const mailer = createMailer(env)

  try {
    await sendMail(mailer, {
      from,
      to,
      replyTo: lead.email,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
    })
  } catch (err) {
    console.error('[offer] staff email failed', err.response || err.message)
    return {
      status: 502,
      body: { error: 'Senden fehlgeschlagen. Bitte telefonisch kontaktieren oder später erneut versuchen.' },
    }
  }

  try {
    await sendMail(mailer, {
      from,
      to: lead.email,
      replyTo: to,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    })
  } catch (err) {
    console.error('[offer] customer copy failed', err.response || err.message)
  }

  return { status: 200, body: { ok: true } }
}

export function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body)
  }
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('invalid json'))
      }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const body = await readJsonBody(req)
    const result = await processOfferRequest(body, process.env)
    res.status(result.status).json(result.body)
  } catch (err) {
    console.error('[offer]', err)
    res.status(500).json({ error: 'Senden fehlgeschlagen. Bitte später erneut versuchen.' })
  }
}
