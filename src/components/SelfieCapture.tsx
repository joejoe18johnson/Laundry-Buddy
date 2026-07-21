import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SelfieCameraModal } from './SelfieCameraModal'
import { SelfieFrameGuide } from './SelfieFrameGuide'
import { PrimaryButton } from './ui'
import { useTheme } from '../context/ThemeContext'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'

interface SelfieCaptureProps {
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
  disabled?: boolean
}

export function SelfieCapture({ photoUri, onPhotoChange, disabled }: SelfieCaptureProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [cameraOpen, setCameraOpen] = useState(false)

  const openCamera = () => {
    if (disabled) return
    setCameraOpen(true)
  }

  return (
    <View style={styles.wrap}>
      {photoUri ? (
        <>
          <View style={styles.previewWrap}>
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            <SelfieFrameGuide />
          </View>
          <View style={styles.actionRow}>
            <PrimaryButton title="Retake selfie" icon="camera" full onPress={openCamera} disabled={disabled} />
            {!disabled ? (
              <Pressable onPress={() => onPhotoChange(null)} hitSlop={8} style={styles.removeBtn}>
                <Text style={styles.removeText}>{toTitleCase('Remove photo')}</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : (
        <View style={[styles.captureCard, disabled && styles.captureCardDisabled]}>
          <SelfieFrameGuide />
          <View style={styles.captureContent}>
            <PrimaryButton
              title="Take selfie"
              icon="camera"
              full
              onPress={openCamera}
              disabled={disabled}
            />
          </View>
        </View>
      )}

      <SelfieCameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={onPhotoChange}
      />
    </View>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: { gap: spacing.md },
    captureCard: {
      minHeight: 240,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.gray200,
      borderRadius: radius.lg,
      backgroundColor: colors.gray50,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    captureCardDisabled: {
      opacity: 0.55,
    },
    captureContent: {
      padding: spacing.lg,
    },
    previewWrap: {
      minHeight: 260,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.green,
      backgroundColor: colors.greenBg,
      position: 'relative',
    },
    preview: { width: '100%', height: 280 },
    actionRow: { gap: spacing.sm },
    removeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
    removeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray500,
      textDecorationLine: 'underline',
    },
  })
}
