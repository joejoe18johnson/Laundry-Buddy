import type { Screen } from '../types'

export function homeScreenForRole(role: 'customer' | 'host'): Screen {
  return role === 'host' ? 'host-dashboard' : 'customer-home'
}

export function mainTabScreens(role: 'customer' | 'host'): Screen[] {
  return role === 'host'
    ? ['host-dashboard', 'host-dryer', 'customer-home', 'messages', 'account']
    : ['customer-home', 'customer-tracking', 'messages', 'account']
}
