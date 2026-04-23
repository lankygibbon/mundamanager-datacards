/**
 * Fetches sample data from Supabase and writes raw responses to sample-data/
 *
 * Usage:
 *   SUPA_COOKIE=<base64-cookie-value> node scripts/fetch-sample-data.mjs [gang_id]
 *   SUPA_TOKEN=<access_token> node scripts/fetch-sample-data.mjs [gang_id]
 *
 * SUPA_COOKIE is preferred — the script will auto-refresh the token from it.
 * Pass a gang UUID as the first argument to target a specific gang (default: first gang).
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const SUPABASE_URL = 'https://iojoritxhpijprgkjfre.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvam9yaXR4aHBpanByZ2tqZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUxMDg0NzMsImV4cCI6MjA0MDY4NDQ3M30.6ZRhreN9fEwLN8vRBcd1uDgkyy_Cjm6U5wxeBNoYyKM'
const USER_ID = '7039e030-faed-4d9a-a4ab-6a475d555160'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'sample-data')
const TOKEN_FILE = join(__dirname, '.supa_tokens.json')
mkdirSync(OUT_DIR, { recursive: true })

// --- Token management ---
async function getToken() {
  // Priority 1: SUPA_COOKIE env var — decode and refresh from it
  if (process.env.SUPA_COOKIE) {
    const session = JSON.parse(Buffer.from(process.env.SUPA_COOKIE, 'base64').toString())
    return refreshToken(session.refresh_token)
  }
  // Priority 2: stored .supa_tokens.json from a previous run
  if (existsSync(TOKEN_FILE)) {
    const stored = JSON.parse(readFileSync(TOKEN_FILE))
    return refreshToken(stored.refresh_token)
  }
  // Priority 3: raw SUPA_TOKEN (may be expired)
  if (process.env.SUPA_TOKEN) {
    console.warn('Warning: using raw SUPA_TOKEN — may be expired')
    return process.env.SUPA_TOKEN
  }
  throw new Error('Set SUPA_COOKIE, or run once with SUPA_COOKIE to store tokens')
}

async function refreshToken(refreshToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  const data = await res.json()
  writeFileSync(TOKEN_FILE, JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  }))
  console.log('Token refreshed and stored.')
  return data.access_token
}

// --- REST query helper ---
async function query(table, params, token) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`${table} ${res.status}: ${await res.text()}`)
  return res.json()
}

function save(filename, data) {
  writeFileSync(join(OUT_DIR, filename), JSON.stringify(data, null, 2))
  const n = Array.isArray(data) ? data.length : 1
  console.log(`  ✓ ${filename}  (${n} rows)`)
}

// ============================================================
const token = await getToken()

// --- 01: Gangs list ---
console.log('\nFetching gangs…')
const gangs = await query('gangs', {
  select: 'id,name,gang_type,rating,credits,reputation,alignment',
  user_id: `eq.${USER_ID}`,
  order: 'name',
}, token)
save('01-gangs.json', gangs)

if (!gangs.length) { console.error('No gangs found'); process.exit(1) }

const gangId = process.argv[2] || gangs[0].id
const gangName = gangs.find(g => g.id === gangId)?.name ?? gangId
console.log(`\nUsing gang: ${gangName} (${gangId})\n`)

// --- 02: Gang detail (includes origin join) ---
console.log('Fetching gang detail…')
const gangDetail = await query('gangs', {
  select: 'id,name,gang_type,credits,rating,reputation,alignment,gang_origins(origin_name)',
  id: `eq.${gangId}`,
}, token)
save('02-gang-detail.json', gangDetail)

// --- 03: Fighters (full schema — includes active_loadout_id, current_loadout, etc.) ---
console.log('Fetching fighters…')
const fighters = await query('fighters', {
  select: [
    'id', 'fighter_name', 'fighter_type', 'fighter_class',
    'movement', 'weapon_skill', 'ballistic_skill', 'strength', 'toughness',
    'wounds', 'initiative', 'attacks', 'leadership', 'cool', 'willpower', 'intelligence',
    'credits', 'xp', 'kills', 'special_rules', 'killed', 'recovery',
    // loadout fields
    'active_loadout_id', 'current_loadout',
    // extra metadata
    'label', 'note', 'fighter_sub_type', 'image_url',
  ].join(','),
  gang_id: `eq.${gangId}`,
  order: 'credits.desc',
}, token)
save('03-fighters.json', fighters)

const fighterIds = fighters.map(f => f.id)

// --- 04: Fighter equipment (includes loadout_id) ---
console.log('Fetching fighter_equipment…')
const equipment = await query('fighter_equipment', {
  select: 'id,fighter_id,equipment_id,loadout_id,gang_stash,is_master_crafted,equipment(equipment_name,equipment_type,equipment_category,cost)',
  gang_id: `eq.${gangId}`,
  gang_stash: 'eq.false',
}, token)
save('04-fighter-equipment.json', equipment)

// --- 05: Fighter skills ---
console.log('Fetching fighter_skills…')
const skills = fighterIds.length
  ? await query('fighter_skills', {
      select: 'fighter_id,skills(name)',
      fighter_id: `in.(${fighterIds.join(',')})`,
    }, token)
  : []
save('05-fighter-skills.json', skills)

// --- 06: Weapon profiles ---
const weaponEquipIds = [...new Set(
  equipment.filter(e => e.equipment?.equipment_type === 'weapon').map(e => e.equipment_id)
)]
console.log('Fetching weapon_profiles…')
const profiles = weaponEquipIds.length
  ? await query('weapon_profiles', {
      select: 'weapon_id,profile_name,range_short,range_long,acc_short,acc_long,strength,ap,damage,ammo,traits',
      weapon_id: `in.(${weaponEquipIds.join(',')})`,
      order: 'sort_order',
    }, token)
  : []
save('06-weapon-profiles.json', profiles)

// --- 07: Fighter loadouts ---
console.log('Fetching fighter_loadouts…')
const loadouts = fighterIds.length
  ? await query('fighter_loadouts', {
      select: 'id,fighter_id,loadout_name,created_at',
      fighter_id: `in.(${fighterIds.join(',')})`,
      order: 'created_at',
    }, token)
  : []
save('07-fighter-loadouts.json', loadouts)

console.log(`\nDone — sample-data/ has 7 files for "${gangName}"`)
console.log('Token stored in scripts/.supa_tokens.json for future runs.')
