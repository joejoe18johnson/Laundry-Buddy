import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { AppIcon } from './AppIcon'
import { BrandActionSheet, BrandAlert, type BrandDialogAction } from './BrandDialog'
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
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null)

  const takeSelfie = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      setAlert({
        title: 'Permission needed',
        message: 'Allow camera access to take a verification selfie.',
      })
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.front,
    })

    if (!result.canceled && result.assets[0]?.uri) {
      onPhotoChange(result.assets[0].uri)
    }
  }

  const sheetActions: BrandDialogAction[] = [
    {
      label: 'Take selfie',
      icon: 'camera',
      variant: 'primary',
      onPress: () => {
        setSheetOpen(false)
        void takeSelfie()
      },
    },
    ...(photoUri
      ? [
          {
            label: 'Retake selfie',
            icon: 'refresh-cw' as const,
            variant: 'outline' as const,
            onPress: () => {
              setSheetOpen(false)
              void takeSelfie()
            },
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
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <>
            <AppIcon name="user" size={24} color={colors.gray500} />
            <Text style={styles.uploadText}>{label ?? toTitleCase('Take verification selfie')}</Text>
            <Text style={styles.uploadHint}>{toTitleCase('Front camera only — face clearly visible')}</Text>
          </>
        )}
      </Pressable>

      <BrandActionSheet
        visible={sheetOpen}
        title="Verification selfie"
        message="Take a clear selfie in good lighting. We use this to confirm your face matches the photo on your ID."
        icon="user"
        actions={sheetActions}
        onClose={() => setSheetOpen(false)}
      />

      <BrandAlert
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message}
        icon="alert-circle"
        onClose={() => setAlert(null)}
      />
    </View>
  )
}

function createStyles() {
  return StyleSheet.create({
    upload: {
      minHeight: 160,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.gray200,
      borderRadius: radius.md,
      backgroundColor: colors.gray50,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.sm,
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
    uploadText: { fontSize: 15, fontWeight: '600', color: colors.gray600, textAlign: 'center' },
    uploadHint: { fontSize: 12, color: colors.gray500, textAlign: 'center' },
    preview: { width: '100%', height: 220, borderRadius: radius.sm },
  })
}
