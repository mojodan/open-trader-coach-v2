import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const COACHING_DIR = 'C:/Users/dhaye/repos/open-trader-coach/open-trader-coach/coaching-webinar'
const LOG_FILE = path.join(process.cwd(), 'view.log')
const COMMENTS_FILE = path.join(process.cwd(), 'public', 'comments.csv')
const BACKUP_DIR = path.join(process.cwd(), 'public', 'backup')

function serveVideoWithRanges(req, res, filePath) {
  let stat
  try { stat = fs.statSync(filePath) } catch {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  const ext = path.extname(filePath).toLowerCase()
  const mime = ext === '.mp4' ? 'video/mp4' : (ext === '.srt' || ext === '.txt') ? 'text/plain; charset=utf-8' : 'application/octet-stream'
  const total = stat.size
  const range = req.headers.range

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
    const start = parseInt(startStr, 10)
    const end = endStr ? parseInt(endStr, 10) : Math.min(start + 1024 * 1024, total - 1)
    const chunkSize = end - start + 1

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mime,
    })
    fs.createReadStream(filePath, { start, end }).pipe(res)
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
    })
    fs.createReadStream(filePath).pipe(res)
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'open-trader-server',
      configureServer(server) {
        // Logger endpoint
        server.middlewares.use('/logger', (req, res) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          let body = ''
          req.on('data', c => { body += c })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body)
              const date = payload['webinar-date'] ?? ''
              const ts = payload['timestamp'] ?? ''
              const question = payload['question'] ?? ''
              const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
              const csv = [now, date, ts, question].map(v => `"${v.replace(/"/g, '""')}"`).join(',')
              fs.appendFileSync(LOG_FILE, csv + '\n', 'utf8')
              res.statusCode = 204
              res.end()
            } catch {
              res.statusCode = 400
              res.end()
            }
          })
        })

        // Save comment to public/comments.csv, backing up the existing file first
        server.middlewares.use('/api/save', (req, res) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          let body = ''
          req.on('data', c => { body += c })
          req.on('end', () => {
            try {
              const csvLine = body.trim()
              if (!csvLine) { res.statusCode = 400; res.end('Empty body'); return }

              const now = new Date()
              const pad = n => String(n).padStart(2, '0')
              const backupTs = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
              const serverTsCsv = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

              if (fs.existsSync(COMMENTS_FILE)) {
                if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
                fs.copyFileSync(COMMENTS_FILE, path.join(BACKUP_DIR, `comments-${backupTs}.csv`))
              }

              fs.appendFileSync(COMMENTS_FILE, `${csvLine},"${serverTsCsv}"\n`, 'utf8')
              res.statusCode = 204
              res.end()
            } catch (e) {
              console.error('[api/save]', e)
              res.statusCode = 500
              res.end()
            }
          })
        })

        // Recent history endpoint — last 10 view.log entries, newest first
        server.middlewares.use('/recent', (req, res) => {
          if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          try {
            const content = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8') : ''
            const lines = content.split('\n').filter(l => l.trim())
            const last10 = lines.slice(-10).reverse()
            const rows = last10.map(line => {
              const fields = []
              let i = 0
              while (i < line.length) {
                if (line[i] === '"') {
                  let j = i + 1, val = ''
                  while (j < line.length) {
                    if (line[j] === '"' && line[j + 1] === '"') { val += '"'; j += 2 }
                    else if (line[j] === '"') { j++; break }
                    else { val += line[j++] }
                  }
                  fields.push(val)
                  i = j; if (line[i] === ',') i++
                } else {
                  const j = line.indexOf(',', i)
                  fields.push(j === -1 ? line.slice(i) : line.slice(i, j))
                  i = j === -1 ? line.length : j + 1
                }
              }
              return fields
            })
            res.statusCode = 200
            res.end(JSON.stringify(rows))
          } catch { res.statusCode = 500; res.end('[]') }
        })

        // Coaching webinar video / SRT file server with range support
        server.middlewares.use('/coaching-webinar', (req, res) => {
          const filePath = path.join(COACHING_DIR, decodeURIComponent(req.url.split('?')[0]))
          res.setHeader('Access-Control-Allow-Origin', '*')
          serveVideoWithRanges(req, res, filePath)
        })
      },
    },
  ],
})
