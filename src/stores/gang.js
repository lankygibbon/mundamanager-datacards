import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useGangStore = defineStore('gang', () => {
  const gangs = ref([])
  const currentGang = ref(null)
  const fighters = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchGangs(userId) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('gangs')
        .select('id,name,gang_type,rating,credits,reputation,alignment')
        .eq('user_id', userId)
        .order('name')
      if (err) throw err
      gangs.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchSheet(gangId) {
    loading.value = true
    error.value = null
    try {
      const [gangRes, fighterRes, equipRes] = await Promise.all([
        supabase
          .from('gangs')
          .select('id,name,gang_type,credits,rating,reputation,alignment,gang_origins(origin_name)')
          .eq('id', gangId)
          .single(),
        supabase
          .from('fighters')
          .select('id,fighter_name,fighter_type,fighter_class,movement,weapon_skill,ballistic_skill,strength,toughness,wounds,initiative,attacks,leadership,cool,willpower,intelligence,credits,xp,kills,special_rules,killed,recovery')
          .eq('gang_id', gangId)
          .order('credits', { ascending: false }),
        supabase
          .from('fighter_equipment')
          .select('id,fighter_id,equipment_id,equipment(equipment_name,equipment_type,equipment_category,cost)')
          .eq('gang_id', gangId)
          .eq('gang_stash', false),
      ])

      if (gangRes.error) throw gangRes.error
      if (fighterRes.error) throw fighterRes.error
      if (equipRes.error) throw equipRes.error

      currentGang.value = gangRes.data

      const fighterIds = fighterRes.data.map(f => f.id)

      const [skillsRes, profilesRes] = await Promise.all([
        fighterIds.length
          ? supabase
              .from('fighter_skills')
              .select('fighter_id,skills(name)')
              .in('fighter_id', fighterIds)
          : Promise.resolve({ data: [], error: null }),
        (() => {
          const weaponEquipIds = [...new Set(
            equipRes.data
              .filter(e => e.equipment?.equipment_type === 'weapon')
              .map(e => e.equipment_id)
          )]
          return weaponEquipIds.length
            ? supabase
                .from('weapon_profiles')
                .select('weapon_id,profile_name,range_short,range_long,acc_short,acc_long,strength,ap,damage,ammo,traits')
                .in('weapon_id', weaponEquipIds)
                .order('sort_order')
            : Promise.resolve({ data: [], error: null })
        })(),
      ])

      if (skillsRes.error) throw skillsRes.error
      if (profilesRes.error) throw profilesRes.error

      // Index equipment by fighter
      const equipByFighter = {}
      for (const row of equipRes.data) {
        if (!equipByFighter[row.fighter_id]) equipByFighter[row.fighter_id] = []
        equipByFighter[row.fighter_id].push(row)
      }

      // Index skills by fighter
      const skillsByFighter = {}
      for (const row of skillsRes.data) {
        if (!skillsByFighter[row.fighter_id]) skillsByFighter[row.fighter_id] = []
        if (row.skills?.name) skillsByFighter[row.fighter_id].push(row.skills.name)
      }

      // Index weapon profiles by equipment id, deduplicating by profile_name within each weapon
      const profilesByEquipId = {}
      for (const p of profilesRes.data) {
        if (!profilesByEquipId[p.weapon_id]) profilesByEquipId[p.weapon_id] = []
        const existing = profilesByEquipId[p.weapon_id]
        if (!existing.some(e => e.profile_name === p.profile_name)) {
          existing.push(p)
        }
      }

      const CLASS_ORDER = { Leader: 0, Champion: 1, Specialist: 2, Ganger: 3, Crew: 4, Juve: 5 }

      fighters.value = [...fighterRes.data]
        .sort((a, b) => {
          const ao = CLASS_ORDER[a.fighter_class] ?? 99
          const bo = CLASS_ORDER[b.fighter_class] ?? 99
          return ao !== bo ? ao - bo : b.credits - a.credits
        })
        .map(f => ({
          ...f,
          equipment: equipByFighter[f.id] || [],
          skills: skillsByFighter[f.id] || [],
          profilesByEquipId,
        }))
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function clearSheet() {
    currentGang.value = null
    fighters.value = []
  }

  return { gangs, currentGang, fighters, loading, error, fetchGangs, fetchSheet, clearSheet }
})
