<template>
  <div class="weapon-card">
    <!-- Weapon header -->
    <div class="weapon-header">
      <span class="weapon-name">{{ equipment.equipment.equipment_name }}</span>
      <span v-if="profiles.length" class="weapon-profile-count">
        {{ profiles.length > 1 ? profiles.length + ' profiles' : profiles[0]?.profile_name && profiles[0].profile_name !== equipment.equipment.equipment_name ? profiles[0].profile_name : '' }}
      </span>
    </div>

    <!-- Profile table -->
    <table class="profile-table">
      <thead>
        <tr>
          <th class="col-name"></th>
          <th class="col-stat">Rng S</th>
          <th class="col-stat">Rng L</th>
          <th class="col-stat">Acc S</th>
          <th class="col-stat">Acc L</th>
          <th class="col-stat">Str</th>
          <th class="col-stat">AP</th>
          <th class="col-stat">D</th>
          <th class="col-stat">Am</th>
          <th class="col-traits">Traits</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in visibleProfiles" :key="p.profile_name" class="profile-row">
          <td class="cell-name">{{ showProfileName ? p.profile_name.replace(/^-\s*/, '') : '' }}</td>
          <td class="cell-stat">{{ p.range_short || '–' }}</td>
          <td class="cell-stat">{{ p.range_long || '–' }}</td>
          <td class="cell-stat">{{ p.acc_short || '–' }}</td>
          <td class="cell-stat">{{ p.acc_long || '–' }}</td>
          <td class="cell-stat cell-str">{{ p.strength || '–' }}</td>
          <td class="cell-stat cell-ap">{{ p.ap || '–' }}</td>
          <td class="cell-stat cell-dmg">{{ p.damage || '–' }}</td>
          <td class="cell-stat cell-am">{{ p.ammo || '–' }}</td>
          <td class="cell-traits">
            <template v-if="!showRulesInline">
              <span
                v-for="(trait, i) in splitTraits(p.traits)"
                :key="trait"
              ><span
                :class="getRuleDesc(trait) ? 'trait-link' : ''"
                @click="getRuleDesc(trait) && emit('rule-click', trait)"
              >{{ trait }}</span><span v-if="i < splitTraits(p.traits).length - 1">, </span></span>
            </template>
            <template v-else>{{ p.traits || '' }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getRuleDesc } from '@/lib/rules'

const props = defineProps({
  equipment: { type: Object, required: true },
  profiles:  { type: Array,  default: () => [] },
  showRulesInline: { type: Boolean, default: true },
})

const emit = defineEmits(['rule-click'])

const STAT_FIELDS = ['range_short', 'range_long', 'acc_short', 'acc_long', 'strength', 'ap', 'damage', 'ammo']

const visibleProfiles = computed(() => {
  const seen = new Set()
  return props.profiles.filter(p => {
    if (!STAT_FIELDS.some(f => p[f] != null && p[f] !== '')) return false
    if (seen.has(p.profile_name)) return false
    seen.add(p.profile_name)
    return true
  })
})

const showProfileName = computed(() => {
  const ps = visibleProfiles.value
  return ps.length > 1 || (ps[0]?.profile_name && ps[0].profile_name !== props.equipment.equipment.equipment_name)
})

function splitTraits(traits) {
  return traits ? traits.split(',').map(t => t.trim()).filter(Boolean) : []
}
</script>

<style scoped>
.weapon-card {
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  overflow: hidden;
  background: #161616;
}

.weapon-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  background: linear-gradient(90deg, #1e1e1e 0%, #1a1a1a 100%);
  border-bottom: 1px solid #2a2a2a;
}

.weapon-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.02em;
}

.weapon-profile-count {
  font-size: 9px;
  color: var(--color-muted);
  font-style: italic;
  white-space: nowrap;
}

.profile-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.profile-table thead tr {
  background: #111;
}

.profile-table thead th {
  color: var(--color-accent);
  font-weight: normal;
  font-size: 8.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.3rem;
  border-right: 1px solid #222;
  white-space: nowrap;
}
.profile-table thead th:last-child { border-right: none; }

.col-name   { text-align: left; width: 70px; max-width: 70px; }
.col-stat   { text-align: center; min-width: 34px; }
.col-traits { text-align: left; padding-left: 0.5rem !important; }

.profile-row:nth-child(even) { background: #141414; }
.profile-row:nth-child(odd)  { background: #161616; }

.cell-name {
  padding: 0.25rem 0.3rem;
  color: var(--color-muted);
  font-style: italic;
  font-size: 9px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
  border-right: 1px solid #222;
}

.cell-stat {
  text-align: center;
  padding: 0.25rem 0.3rem;
  font-weight: 600;
  font-size: 11px;
  color: var(--color-text);
  border-right: 1px solid #222;
}
.cell-stat:last-child { border-right: none; }

/* Subtle tints for key combat stats */
.cell-str  { color: #d4a47a; }
.cell-ap   { color: #c47a7a; }
.cell-dmg  { color: #e0e0a0; }
.cell-am   { color: #80a0c0; }

.cell-traits {
  padding: 0.25rem 0.3rem 0.25rem 0.5rem;
  color: #9ab5d4;
  font-size: 9px;
  line-height: 1.4;
  border-right: none;
}

.trait-link {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}
.trait-link:hover { color: var(--color-accent); }
</style>
