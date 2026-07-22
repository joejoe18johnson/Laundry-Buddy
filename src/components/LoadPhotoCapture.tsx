import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { BrandActionSheet, BrandAlert, type BrandDialogAction } from './BrandDialog'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { pickImage } from '../lib/imagePicker'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'

interface LoadPhotoCaptureProps {
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
}

export function LoadPhotoCapture({ photoUri, onPhotoChange }: LoadPhotoCaptureProps) {
  const { screen, restoreAfterCamera } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null)

  const pickPhoto = async (useCamera: boolean) => {
    const result = await pickImage(useCamera ? 'camera' : 'library', {
      quality: 0.7,
      returnScreen: screen,
    })
    restoreAfterCamera()

    if (result.ok) {
      onPhotoChange(result.uri)
      return
    }

    if (result.reason === 'permission_denied') {
      setAlert({
        title: 'Permission needed',
        message: useCamera
          ? 'Allow camera access to photograph your load.'
          : 'Allow photo library access to choose a picture of your load.',
      })
    }
  }

  const sheetActions: BrandDialogAction[] = [
    {
      label: 'Take photo',
      icon: 'camera',
      variant: 'primary',
      onPress: () => {
        setSheetOpen(false)
        void pickPhoto(true)
      },
    },
    {
      label: 'Choose from library',
      icon: 'image',
      variant: 'outline',
      onPress: () => {
        setSheetOpen(false)
        void pickPhoto(false)
      },
    },
    ...(photoUri
      ? [
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
      <Pressable onPress={() => setSheetOpen(true)} style={[styles.upload, photoUri && styles.uploadDone]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <>
            <AppIcon name="camera" size={28} color={colors.gray500} />
            <Text style={styles.uploadText}>{toTitleCase('Snap a photo of your load')}</Text>
            <Text style={styles.uploadHint}>{toTitleCase('Optional — helps the host prepare')}</Text>
          </>
        )}
      </Pressable>
      {photoUri ? (
        <Pressable onPress={() => setSheetOpen(true)} style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>{toTitleCase('Change photo')}</Text>
        </Pressable>
      ) : null}

      <BrandActionSheet
        visible={sheetOpen}
        title="Load photo"
        message="Help your host see what you are dropping off."
        icon="camera"
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

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    upload: {
      minHeight: 160,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.gray200,
      borderRadius: radius.lg,
      backgroundColor: colors.gray50,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      overflow: 'hidden',
    },
    uploadDone: {
      borderStyle: 'solid',
      borderColor: colors.black,
      padding: 0,
    },
    preview: { width: '100%', height: 200, borderRadius: radius.lg - 2 },
    uploadText: { fontSize: 15, fontWeight: '600', color: colors.black },
    uploadHint: { fontSize: 13, color: colors.gray500 },
    changeBtn: { alignSelf: 'center', marginTop: spacing.sm, paddingVertical: spacing.sm },
    changeBtnText: { fontSize: 14, fontWeight: '600', color: colors.gray600 },
  })
}
