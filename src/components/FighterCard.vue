<template>
  <div
    class="bg-surface border border-border rounded-lg overflow-hidden text-[13px] shadow-sm"
    :class="{ 'opacity-40': fighter.killed, 'border-[#8b6c20]': fighter.recovery }"
  >
    <!-- Header -->
    <div class="card-header-row border-b border-border flex justify-between items-baseline gap-3" :class="headerClass">
      <div class="font-bold text-[14px] truncate" :class="nameClass">{{ fighter.fighter_name }}</div>
      <div class="text-[11px] text-muted whitespace-nowrap shrink-0">{{ fighter.fighter_type }}</div>
    </div>

    <!-- Stats -->
    <table class="w-full border-b border-[#333] border-collapse">
      <thead>
        <tr class="border-b border-[#333]">
          <th v-for="[key] in stats" :key="key" class="stat-th">{{ key }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td v-for="[key, val] in stats" :key="key" class="stat-td">{{ val }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Status row -->
    <div class="card-row border-b border-[#333] flex gap-4 text-[10px] text-muted">
      <span v-if="fighter.xp">XP: <span class="text-text font-medium">{{ fighter.xp }}</span></span>
      <span v-if="fighter.kills">Kills: <span class="text-text font-medium">{{ fighter.kills }}</span></span>
      <span v-if="fighter.recovery" class="text-[#c8a030] font-bold tracking-wide">RECOVERY</span>
      <span class="ml-auto">Base: <span class="text-text font-medium">{{ fighter.credits }}cr</span> · Total: <span class="text-text font-medium">{{ totalCost }}cr</span></span>
    </div>

    <!-- Weapons -->
    <div v-if="weapons.length" class="section-block">
      <div class="section-label">Weapons</div>
      <div class="weapons-list">
        <WeaponCard
          v-for="eq in weapons"
          :key="eq.id"
          :equipment="eq"
          :profiles="profilesFor(eq)"
          :show-rules-inline="showRulesInline"
          @rule-click="emit('rule-click', $event)"
        />
      </div>
    </div>

    <!-- Wargear -->
    <div v-if="wargear.length" class="section-block">
      <div class="section-label">Wargear</div>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="eq in wargear"
          :key="eq.id"
          class="tag-muted"
          :class="!showRulesInline && getRuleDesc(eq.equipment.equipment_name) ? 'cursor-pointer hover:border-accent hover:text-accent border border-transparent' : ''"
          @click="!showRulesInline && getRuleDesc(eq.equipment.equipment_name) && emit('rule-click', eq.equipment.equipment_name)"
        >{{ eq.equipment.equipment_name }}</span>
      </div>
    </div>

    <!-- Skills -->
    <div v-if="fighter.skills?.length" class="section-block">
      <div class="section-label">Skills</div>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="skill in fighter.skills"
          :key="skill"
          class="tag-skill"
          :class="!showRulesInline && getRuleDesc(skill) ? 'cursor-pointer hover:border-[#a8c4a8] hover:text-white' : ''"
          @click="!showRulesInline && getRuleDesc(skill) && emit('rule-click', skill)"
        >{{ skill }}</span>
      </div>
    </div>

    <!-- Rules -->
    <div v-if="inlineRules.length" class="section-block">
      <div class="section-label">Rules</div>
      <template v-if="showRulesInline">
        <div v-for="rule in inlineRules" :key="rule.name" class="mb-2 last:mb-0 leading-snug">
          <span class="text-accent font-semibold text-[10px]">{{ rule.name }}</span>
          <span class="text-[#aaa] text-[10px]"> — {{ rule.desc }}</span>
        </div>
      </template>
      <div v-else class="flex flex-wrap gap-1.5">
        <span
          v-for="rule in inlineRules"
          :key="rule.name"
          class="tag-rule cursor-pointer"
          @click="emit('rule-click', rule.name)"
        >{{ rule.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getRuleDesc } from '@/lib/rules'
import WeaponCard from '@/components/WeaponCard.vue'

const props = defineProps({
  fighter: { type: Object, required: true },
  showRulesInline: { type: Boolean, default: true },
})

const emit = defineEmits(['rule-click'])

const CLASS_HEADER = {
  Leader:   'bg-[#2a2510] border-b-[#6a5a20]',
  Champion: 'bg-[#101820] border-b-[#2a4060]',
  Ganger:   'bg-[#101810] border-b-[#204020]',
  Juve:     'bg-[#180f18] border-b-[#3a2040]',
  Crew:     'bg-[#1a1610] border-b-[#403520]',
}
const CLASS_NAME = {
  Leader:   'text-[#e8c87a]',
  Champion: 'text-[#9ab5d4]',
  Ganger:   'text-[#a8c4a8]',
  Juve:     'text-[#c4a8c4]',
  Crew:     'text-[#c4b8a8]',
}

const cls = computed(() => props.fighter.fighter_class || 'Ganger')
const headerClass = computed(() => CLASS_HEADER[cls.value] || '')
const nameClass = computed(() => CLASS_NAME[cls.value] || 'text-text')

const stats = computed(() => {
  const f = props.fighter
  return [
    ['M', f.movement + '"'],
    ['WS', f.weapon_skill + '+'],
    ['BS', f.ballistic_skill + '+'],
    ['S', f.strength],
    ['T', f.toughness],
    ['W', f.wounds],
    ['I', f.initiative + '+'],
    ['A', f.attacks],
    ['Ld', f.leadership + '+'],
    ['Cl', f.cool + '+'],
    ['Wil', f.willpower + '+'],
    ['Int', f.intelligence + '+'],
  ]
})

const weapons = computed(() =>
  (props.fighter.equipment || []).filter(e => e.equipment?.equipment_type === 'weapon')
)
const wargear = computed(() =>
  (props.fighter.equipment || []).filter(e => e.equipment?.equipment_type === 'wargear')
)

const totalCost = computed(() => {
  const equipCost = (props.fighter.equipment || []).reduce((sum, e) => sum + (e.equipment?.cost || 0), 0)
  return (props.fighter.credits || 0) + equipCost
})


function splitTraits(traits) {
  return traits ? traits.split(',').map(t => t.trim()).filter(Boolean) : []
}

function profilesFor(eq) {
  return props.fighter.profilesByEquipId?.[eq.equipment_id] || []
}

const inlineRules = computed(() => {
  const seen = new Map()
  const add = (name) => { const desc = getRuleDesc(name); if (desc) seen.set(name, desc) }

  if (props.showRulesInline) {
    for (const sr of props.fighter.special_rules || []) add(sr)
    for (const s of props.fighter.skills || []) add(s)
    for (const eq of weapons.value) {
      for (const p of profilesFor(eq)) {
        if (p.traits) p.traits.split(',').map(t => t.trim()).forEach(add)
      }
    }
    for (const eq of wargear.value) add(eq.equipment.equipment_name)
  } else {
    for (const sr of props.fighter.special_rules || []) add(sr)
  }

  return [...seen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, desc]) => ({ name, desc }))
})
</script>

<style scoped>
.stat-th {
  text-align: center;
  font-size: 9px;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
  padding: 0.2rem 0.25rem 0.15rem;
  border-right: 1px solid #333;
  background: #1e1e1e;
}
.stat-th:last-child { border-right: none; }
.stat-td {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  padding: 0.2rem 0.25rem 0.25rem;
  border-right: 1px solid #333;
}
.stat-td:last-child { border-right: none; }
.card-header-row {
  padding: 0.4rem 0.75rem;
}
.card-row {
  padding: 0.2rem 0.75rem;
}
.section-block {
  padding: 0.4rem 0.75rem 0.5rem;
  border-top: 1px solid #333;
}
.section-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-muted);
  margin-bottom: 0.25rem;
}
.weapons-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.tag-muted {
  background: #2a2a2a;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  color: var(--color-muted);
}
.tag-skill {
  background: #1e2a1e;
  border: 1px solid #2a4a2a;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  color: #a8c4a8;
}
.tag-rule {
  background: #2a2010;
  border: 1px solid #5a4a20;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  color: var(--color-accent);
}
</style>
