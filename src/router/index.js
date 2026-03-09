import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/gangs',
    name: 'gangs',
    component: () => import('@/views/GangListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/gangs/:id',
    name: 'sheet',
    component: () => import('@/views/SheetView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'login' }
  if (to.meta.requiresGuest && auth.isLoggedIn) return { name: 'gangs' }
})

export default router
