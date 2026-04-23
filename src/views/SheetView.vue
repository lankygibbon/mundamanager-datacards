<template>
  <div class="p-6 max-w-[1400px] mx-auto">
    <!-- Header -->
    <div class="bg-surface border border-border rounded-lg px-6 py-4 mb-6 flex justify-between items-start gap-6 flex-wrap">
      <div>
        <h1 class="text-accent text-2xl font-bold leading-tight">{{ gangStore.currentGang?.name }}</h1>
        <div class="text-muted text-xs mt-1">{{ gangMeta }}</div>
      </div>

      <div class="flex gap-8">
        <div v-for="stat in gangStats" :key="stat.label" class="text-center">
          <div class="text-accent text-xl font-bold leading-none">{{ stat.value }}</div>
          <div class="text-muted text-[10px] uppercase tracking-widest mt-1">{{ stat.label }}</div>
        </div>
      </div>

      <div class="flex gap-2 flex-wrap items-center">
        <button class="ctrl-btn" @click="router.push({ name: 'gangs' })">← Back</button>
        <button class="ctrl-btn" @click="print">Print</button>
        <button class="ctrl-btn active" @click="toggleRulesMode">
          Rules: {{ rulesMode }}
        </button>
        <button class="ctrl-btn active" @click="toggleSortCost">
          Cost: {{ sortCost }}
        </button>
      </div>
    </div>

    <div v-if="gangStore.loading" class="text-muted text-center py-16">Loading…</div>
    <div v-else-if="gangStore.error" class="text-red-400 text-center py-16">{{ gangStore.error }}</div>

    <template v-else>
      <!-- Fighter cards -->
      <div id="fighters-grid" class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(360px, 1fr))">
        <FighterCard
          v-for="fighter in sortedFighters"
          :key="fighter.id"
          :fighter="fighter"
          :show-rules-inline="rulesMode === 'inline'"
          @rule-click="scrollToRule"
        />
      </div>

      <!-- Consolidated rules reference -->
      <div v-if="rulesMode === 'reference' && consolidatedRules.length" class="mt-6 print:break-before-page">
        <div class="bg-surface border border-border rounded-lg px-6 py-5">
          <div class="text-accent text-xs font-bold uppercase tracking-widest mb-4">Rules Reference</div>
          <div class="columns-2 gap-8">
            <div v-for="rule in consolidatedRules" :key="rule.name" :id="ruleId(rule.name)" class="rule-entry mb-3 break-inside-avoid leading-snug rounded px-1 -mx-1 transition-colors">
              <span class="text-accent font-semibold text-[10px]">{{ rule.name }}</span>
              <span class="text-[#aaa] text-[10px]"> — {{ rule.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import { useGangStore } from '@/stores/gang'
import { getRuleDesc } from '@/lib/rules'
import FighterCard from '@/components/FighterCard.vue'

const route = useRoute()
const router = useRouter()
const gangStore = useGangStore()

const rulesMode = useLocalStorage('rulesMode', 'inline')
const sortCost = useLocalStorage('sortCost', 'base')

function print() { window.print() }

function ruleId(name) {
  return 'rule-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function scrollToRule(name) {
  const el = document.getElementById(ruleId(name))
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('rule-highlighted')
  setTimeout(() => el.classList.remove('rule-highlighted'), 1800)
}


function toggleRulesMode() {
  rulesMode.value = rulesMode.value === 'inline' ? 'reference' : 'inline'
}

function toggleSortCost() {
  sortCost.value = sortCost.value === 'base' ? 'total' : 'base'
}

const CLASS_ORDER = { Leader: 0, Champion: 1, Specialist: 2, Ganger: 3, Crew: 4, Juve: 5 }

function fighterTotalCost(f) {
  return (f.credits || 0) + (f.equipment || []).reduce((sum, e) => sum + (e.equipment?.cost || 0), 0)
}

const sortedFighters = computed(() =>
  [...gangStore.fighters].sort((a, b) => {
    const ao = CLASS_ORDER[a.fighter_class] ?? 99
    const bo = CLASS_ORDER[b.fighter_class] ?? 99
    if (ao !== bo) return ao - bo
    const ca = sortCost.value === 'total' ? fighterTotalCost(a) : (a.credits || 0)
    const cb = sortCost.value === 'total' ? fighterTotalCost(b) : (b.credits || 0)
    return cb - ca
  })
)

onMounted(() => gangStore.fetchSheet(route.params.id))

const gangMeta = computed(() => {
  const g = gangStore.currentGang
  if (!g) return ''
  return [g.gang_type, g.alignment, g.gang_origins?.origin_name].filter(Boolean).join(' · ')
})

const gangStats = computed(() => {
  const g = gangStore.currentGang
  if (!g) return []
  return [
    { label: 'Rating', value: g.rating },
    { label: 'Credits', value: g.credits },
    { label: 'Rep', value: g.reputation },
  ]
})

const consolidatedRules = computed(() => {
  const seen = new Map()
  for (const fighter of sortedFighters.value) {
    for (const name of collectRuleNames(fighter)) {
      if (!seen.has(name)) {
        const desc = getRuleDesc(name)
        if (desc) seen.set(name, desc)
      }
    }
  }
  return [...seen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, desc]) => ({ name, desc }))
})

function collectRuleNames(fighter) {
  const names = new Set()
  for (const sr of fighter.special_rules || []) names.add(sr)
  for (const s of fighter.skills || []) names.add(s)
  for (const eq of fighter.equipment || []) {
    if (eq.equipment?.equipment_type === 'weapon') {
      for (const p of fighter.profilesByEquipId?.[eq.equipment_id] || []) {
        if (p.traits) p.traits.split(',').map(t => t.trim()).forEach(t => names.add(t))
      }
    } else if (eq.equipment?.equipment_type === 'wargear') {
      names.add(eq.equipment.equipment_name)
    }
  }
  return names
}
</script>

<style scoped>
.ctrl-btn {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  font-size: 12px;
  transition: border-color 0.15s, color 0.15s;
}
.ctrl-btn:hover { border-color: var(--color-text); color: var(--color-text); }
.ctrl-btn.active { border-color: var(--color-accent); color: var(--color-accent); }

.rule-entry { transition: background-color 0.2s ease; }
.rule-highlighted { background-color: #3a2e10 !important; }

@media print {
  #fighters-grid {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
  }

  #fighters-grid > * {
    break-inside: avoid;
  }
}
</style>
