import { useMemo } from 'react'
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'

type Props = {
  visible: boolean
  imageUri: string | null
  onClose: () => void
}

export function ImageLightbox({ visible, imageUri, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        closeBtn: {
          position: 'absolute',
          right: 16,
          zIndex: 2,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        imageWrap: {
          width,
          height: height - insets.top - insets.bottom - 48,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 12,
        },
        image: {
          width: '100%',
          height: '100%',
        },
        hint: {
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16),
          fontSize: 13,
          color: 'rgba(255, 255, 255, 0.72)',
        },
      }),
    [height, insets.bottom, insets.top, width],
  )

  if (!imageUri) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close image" />
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <AppIcon name="x" size={22} color="#fff" />
        </Pressable>
        <View style={styles.imageWrap} pointerEvents="box-none">
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>
        <Text style={styles.hint}>Tap anywhere to close</Text>
      </View>
    </Modal>
  )
}
