/**
 * Fetches sample data from Supabase and writes raw responses to sample-data/
 * Usage: SUPA_TOKEN=<access_token> node scripts/fetch-sample-data.mjs [gang_id]
 */

import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const SUPABASE_URL = 'https://iojoritxhpijprgkjfre.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvam9yaXR4aHBpanByZ2tqZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUxMDg0NzMsImV4cCI6MjA0MDY4NDQ3M30.6ZRhreN9fEwLN8vRBcd1uDgkyy_Cjm6U5wxeBNoYyKM'

const token = process.env.SUPA_TOKEN
if (!token) { console.error('Set SUPA_TOKEN'); process.exit(1) }

const USER_ID = '7039e030-faed-4d9a-a4ab-6a475d555160'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'sample-data')
mkdirSync(OUT_DIR, { recursive: true })

function save(filename, data) {
  const path = join(OUT_DIR, filename)
  writeFileSync(path, JSON.stringify(data, null, 2))
  const count = Array.isArray(data) ? data.length : (data?.length ?? '?')
  console.log(`  ✓ ${filename}  (${count} rows)`)
}

async function query(table, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${table} ${res.status}: ${text}`)
  }
  return res.json()
}

// --- Gangs ---
console.log('Fetching gangs…')
const gangs = await query('gangs', {
  select: 'id,name,gang_type,rating,credits,reputation,alignment',
  user_id: `eq.${USER_ID}`,
  order: 'name',
})
save('01-gangs.json', gangs)

if (!gangs.length) { console.error('No gangs found'); process.exit(1) }

const gangId = process.argv[2] || gangs[0].id
const gangName = gangs.find(g => g.id === gangId)?.name ?? gangId
console.log(`\nUsing gang: ${gangName} (${gangId})\n`)

// --- Gang detail with origin ---
console.log('Fetching gang detail…')
const gangDetail = await query('gangs', {
  select: 'id,name,gang_type,credits,rating,reputation,alignment,gang_origins(origin_name)',
  id: `eq.${gangId}`,
})
save('02-gang-detail.json', gangDetail)

// --- Fighters ---
console.log('Fetching fighters…')
const fighters = await query('fighters', {
  select: 'id,fighter_name,fighter_type,fighter_class,movement,weapon_skill,ballistic_skill,strength,toughness,wounds,initiative,attacks,leadership,cool,willpower,intelligence,credits,xp,kills,special_rules,killed,recovery',
  gang_id: `eq.${gangId}`,
  order: 'credits.desc',
})
save('03-fighters.json', fighters)

const fighterIds = fighters.map(f => f.id)

// --- Fighter equipment ---
console.log('Fetching fighter_equipment…')
const equipment = await query('fighter_equipment', {
  select: 'id,fighter_id,equipment_id,equipment(equipment_name,equipment_type,equipment_category,cost)',
  gang_id: `eq.${gangId}`,
  gang_stash: 'eq.false',
})
save('04-fighter-equipment.json', equipment)

// --- Fighter skills ---
console.log('Fetching fighter_skills…')
const skills = fighterIds.length
  ? await query('fighter_skills', {
      select: 'fighter_id,skills(name)',
      fighter_id: `in.(${fighterIds.join(',')})`,
    })
  : []
save('05-fighter-skills.json', skills)

// --- Weapon profiles ---
const weaponEquipIds = [...new Set(
  equipment
    .filter(e => e.equipment?.equipment_type === 'weapon')
    .map(e => e.equipment_id)
)]
console.log('Fetching weapon_profiles…')
const profiles = weaponEquipIds.length
  ? await query('weapon_profiles', {
      select: 'weapon_id,profile_name,range_short,range_long,acc_short,acc_long,strength,ap,damage,ammo,traits',
      weapon_id: `in.(${weaponEquipIds.join(',')})`,
      order: 'sort_order',
    })
  : []
save('06-weapon-profiles.json', profiles)

console.log(`\nDone — sample-data/ has 6 files for "${gangName}"`)
