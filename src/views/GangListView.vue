<template>
  <div class="max-w-2xl mx-auto p-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-accent text-lg font-semibold">Your Gangs</h2>
      <button class="text-muted border border-border rounded px-3 py-1 text-xs hover:text-text hover:border-text" @click="auth.logout()">
        Sign out
      </button>
    </div>

    <div v-if="gangStore.loading" class="text-muted text-center py-12">Loading gangs…</div>
    <div v-else-if="gangStore.error" class="text-red-400 text-center py-12">{{ gangStore.error }}</div>
    <div v-else-if="!gangStore.gangs.length" class="text-muted text-center py-12">No gangs found.</div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="gang in gangStore.gangs"
        :key="gang.id"
        class="bg-surface border border-border rounded-lg px-4 py-3 flex justify-between items-center cursor-pointer hover:border-accent transition-colors"
        @click="router.push({ name: 'sheet', params: { id: gang.id } })"
      >
        <div>
          <div class="font-semibold text-text">{{ gang.name }}</div>
          <div class="text-muted text-xs">{{ gang.gang_type }}<span v-if="gang.alignment"> · {{ gang.alignment }}</span></div>
        </div>
        <div class="text-accent text-xs">Rating {{ gang.rating }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGangStore } from '@/stores/gang'

const auth = useAuthStore()
const gangStore = useGangStore()
const router = useRouter()

onMounted(() => gangStore.fetchGangs(auth.userId))
</script>
