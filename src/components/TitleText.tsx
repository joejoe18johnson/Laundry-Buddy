import { Text, type TextProps } from 'react-native'
import { toTitleCase } from '../lib/titleCase'

type Props = TextProps & {
  /** When false, render children unchanged (names, prices, user content). */
  format?: boolean
}

/** UI label text with consistent Title Case formatting. */
export function TitleText({ children, format = true, ...props }: Props) {
  const content =
    format && typeof children === 'string' ? toTitleCase(children) : children
  return <Text {...props}>{content}</Text>
}
