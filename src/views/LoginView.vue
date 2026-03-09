<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="w-full max-w-sm bg-surface border border-border rounded-lg p-8">
      <h1 class="text-xl font-semibold text-accent mb-1">Necromunda Cheat Sheet</h1>
      <p class="text-muted text-xs mb-6">Sign in with your MundaManager account</p>

      <label class="block text-muted text-xs uppercase tracking-wide mb-1">Email</label>
      <input
        v-model="email"
        type="email"
        placeholder="you@example.com"
        class="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text mb-4 outline-none focus:border-accent"
        @keyup.enter="submit"
      />

      <label class="block text-muted text-xs uppercase tracking-wide mb-1">Password</label>
      <input
        v-model="password"
        type="password"
        placeholder="••••••••"
        class="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text mb-4 outline-none focus:border-accent"
        @keyup.enter="submit"
      />

      <button
        :disabled="loading"
        class="w-full bg-accent text-bg font-semibold rounded py-2 text-sm disabled:opacity-50"
        @click="submit"
      >
        {{ loading ? 'Signing in…' : 'Sign In' }}
      </button>

      <p v-if="errorMsg" class="text-red-400 text-xs mt-3">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function submit() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    router.push({ name: 'gangs' })
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
