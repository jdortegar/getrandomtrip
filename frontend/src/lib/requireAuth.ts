import { useUserStore } from '@/store/userStore'

export function requireAuth(action: () => void) {
  const { isAuthed, openAuth } = useUserStore.getState()
  if (isAuthed) return action()
  openAuth() // abre modal
}
