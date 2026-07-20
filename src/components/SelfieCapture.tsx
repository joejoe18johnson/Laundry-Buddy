import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { BrandActionSheet, type BrandDialogAction } from './BrandDialog'
import { SelfieCameraModal } from './SelfieCameraModal'
import { SelfieFrameGuide } from './SelfieFrameGuide'
import { useTheme } from '../context/ThemeContext'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

interface SelfieCaptureProps {
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
  label?: string
  disabled?: boolean
}

export function SelfieCapture({ photoUri, onPhotoChange, label, disabled }: SelfieCaptureProps) {
  const styles = useMemo(() => createStyles(), [])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)

  const openCamera = () => {
    setSheetOpen(false)
    setCameraOpen(true)
  }

  const sheetActions: BrandDialogAction[] = [
    {
      label: 'Take selfie',
      icon: 'camera',
      variant: 'primary',
      onPress: openCamera,
    },
    ...(photoUri
      ? [
          {
            label: 'Retake selfie',
            icon: 'refresh-cw' as const,
            variant: 'outline' as const,
            onPress: openCamera,
          },
          {
            label: 'Remove photo',
            icon: 'trash-2' as const,
            variant: 'danger' as const,
            onPress: () => {
              setSheetOpen(false)
              onPhotoChange(null)
            },
          },
        ]
      : []),
    {
      label: 'Cancel',
      variant: 'ghost',
      onPress: () => setSheetOpen(false),
    },
  ]

  return (
    <View>
      <Pressable
        onPress={() => !disabled && setSheetOpen(true)}
        disabled={disabled}
        style={[styles.upload, photoUri && styles.uploadDone, disabled && styles.uploadDisabled]}
      >
        {photoUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            <SelfieFrameGuide />
          </View>
        ) : (
          <View style={styles.placeholder}>
            <SelfieFrameGuide label="Center your face in the oval" />
            <View style={styles.placeholderContent}>
              <AppIcon name="user" size={24} color={colors.gray500} />
              <Text style={styles.uploadText}>{label ?? toTitleCase('Take verification selfie')}</Text>
              <Text style={styles.uploadHint}>
                {toTitleCase('Front camera · face clearly visible · good lighting')}
              </Text>
            </View>
          </View>
        )}
      </Pressable>

      <BrandActionSheet
        visible={sheetOpen}
        title="Verification selfie"
        message="Use the face guide to center yourself. We compare this selfie to the photo on your ID."
        icon="user"
        actions={sheetActions}
        onClose={() => setSheetOpen(false)}
      />

      <SelfieCameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={onPhotoChange}
      />
    </View>
  )
}

function createStyles() {
  return StyleSheet.create({
    upload: {
      minHeight: 220,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.gray200,
      borderRadius: radius.md,
      backgroundColor: colors.gray50,
      overflow: 'hidden',
    },
    uploadDone: {
      borderStyle: 'solid',
      borderColor: colors.green,
      backgroundColor: colors.greenBg,
    },
    uploadDisabled: {
      opacity: 0.55,
      backgroundColor: colors.gray75,
    },
    placeholder: {
      minHeight: 220,
      justifyContent: 'center',
    },
    placeholderContent: {
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    },
    uploadText: { fontSize: 15, fontWeight: '600', color: colors.gray600, textAlign: 'center' },
    uploadHint: { fontSize: 12, color: colors.gray500, textAlign: 'center' },
    previewWrap: {
      minHeight: 220,
      position: 'relative',
    },
    preview: { width: '100%', height: 260 },
  })
}
