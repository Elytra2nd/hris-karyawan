/* Clean slate: hapus karyawan+kontrak test, set Branch ke daftar resmi Astra
 * Kalbar (H721-H730, sesuai dokumen BA Bu Yanti). Jalankan:
 *   node --env-file=.env scripts/reset-branches.cjs
 */
const { PrismaClient } = require('@prisma/client')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')
const adapter = new PrismaMariaDb({host:process.env.DB_HOST??'localhost',port:Number(process.env.DB_PORT??3306),user:process.env.DB_USER??'root',password:process.env.DB_PASSWORD??'',database:process.env.DB_NAME??'hris_karyawan',connectionLimit:1})
const p = new PrismaClient({adapter})

const BRANCHES = [
  { code: 'H721', label: 'KETAPANG' },
  { code: 'H722', label: 'PATTIMURA' },
  { code: 'H723', label: 'SINGKAWANG' },
  { code: 'H724', label: 'SANGGAU' },
  { code: 'H725', label: 'IMAM BONJOL' },
  { code: 'H726', label: 'NDS AYANI' },
  { code: 'H727', label: 'BENUA KAYONG' },
  { code: 'H728', label: 'SINTANG' },
  { code: 'H729', label: 'PUTUSSIBAU' },
  { code: 'H730', label: 'SAMBAS' },
]

;(async()=>{
  const before = { emp: await p.employee.count(), con: await p.contract.count(), br: await p.branch.count() }
  console.log('SEBELUM:', JSON.stringify(before))
  const c = await p.contract.deleteMany({})
  const e = await p.employee.deleteMany({})
  const b = await p.branch.deleteMany({})
  console.log(`Dihapus: ${c.count} kontrak, ${e.count} karyawan, ${b.count} branch`)
  await p.branch.createMany({ data: BRANCHES })
  const newBranches = await p.branch.findMany({ orderBy: { code: 'asc' }, select: { code: true, label: true } })
  const positions = await p.position.count()
  const users = await p.user.count()
  console.log('SESUDAH: branches=', newBranches.map(x=>x.code+'='+x.label).join(', '))
  console.log('Positions tetap:', positions, '| Users tetap:', users, '| Karyawan:', await p.employee.count())
  await p.$disconnect()
})().catch(e=>{console.error('ERR',e.message);process.exit(1)})
