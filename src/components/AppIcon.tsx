import { Feather } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { colors } from '../theme'

export type IconName = ComponentProps<typeof Feather>['name']

type Props = {
  name: IconName
  size?: number
  color?: string
}

export function AppIcon({ name, size = 20, color = colors.black }: Props) {
  return <Feather name={name} size={size} color={color} />
}
