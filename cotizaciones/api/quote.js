module.exports = async function quote(req, res) {
  const origin = req.headers.origin;
  if (!['https://ennefrd.com', 'https://www.ennefrd.com'].includes(origin)) {
    return res.status(403).end();
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();
  const fields = req.body || {};
  const limits = { name: 100, email: 254, business: 160, service: 80, message: 4000 };
  const data = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = fields[key] ?? '';
    if (typeof value !== 'string' || value.length > max) return res.status(400).end();
    data[key] = value.trim();
  }
  if (!data.name || !data.service || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).end();
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return res.status(503).end();
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM, to: ['ennefrd@gmail.com'], reply_to: data.email,
        subject: 'Solicitud de cotización en Ennef',
        text: ['Nombre: ' + data.name, 'Correo: ' + data.email, 'Negocio: ' + data.business,
          'Servicio: ' + data.service, '', data.message].join('\n')
      })
    });
    if (!response.ok || !(await response.json()).id) return res.status(502).end();
    return res.status(200).json({ sent: true });
  } catch {
    return res.status(502).end();
  }
};
