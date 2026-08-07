const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false
const hostname = '0.0.0.0'
const port = process.env.PORT || 8080

// Tanpa secret, NextAuth jatuh ke fallback dan seluruh JWT jadi tak tepercaya.
// Dicek di sini (startup server), bukan saat import module: mesin build memang
// tidak punya secret, dan cek di module scope menggagalkan `next build`.
if (!process.env.NEXTAUTH_SECRET) {
  console.error('FATAL: NEXTAUTH_SECRET belum diisi - set di environment cPanel sebelum start.')
  process.exit(1)
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
