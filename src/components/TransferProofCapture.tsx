import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { AppIcon } from './AppIcon'
import { BrandActionSheet, BrandAlert, type BrandDialogAction } from './BrandDialog'
import { useTheme } from '../context/ThemeContext'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'

interface TransferProofCaptureProps {
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
}

export function TransferProofCapture({ photoUri, onPhotoChange }: TransferProofCaptureProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null)

  const pickPhoto = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setAlert({
        title: 'Permission needed',
        message: useCamera
          ? 'Allow camera access to photograph your transfer receipt.'
          : 'Allow photo library access to choose your transfer screenshot.',
      })
      return
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: false,
        })

    if (!result.canceled && result.assets[0]?.uri) {
      onPhotoChange(result.assets[0].uri)
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
      label: 'Choose screenshot',
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
            <AppIcon name="image" size={28} color={colors.gray500} />
            <Text style={styles.uploadText}>{toTitleCase('Add transfer screenshot')}</Text>
            <Text style={styles.uploadHint}>{toTitleCase('Bank app receipt or transfer confirmation')}</Text>
          </>
        )}
      </Pressable>
      {photoUri ? (
        <Pressable onPress={() => setSheetOpen(true)} style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>{toTitleCase('Change screenshot')}</Text>
        </Pressable>
      ) : null}

      <BrandActionSheet
        visible={sheetOpen}
        title="Transfer proof"
        message="Add a screenshot or photo of your bank transfer."
        icon="dollar-sign"
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
      minHeight: 140,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.gray200,
      borderRadius: radius.lg,
      backgroundColor: colors.white,
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
    preview: { width: '100%', height: 180, borderRadius: radius.lg - 2 },
    uploadText: { fontSize: 15, fontWeight: '600', color: colors.black },
    uploadHint: { fontSize: 13, color: colors.gray500, textAlign: 'center', paddingHorizontal: spacing.md },
    changeBtn: { alignSelf: 'center', marginTop: spacing.sm, paddingVertical: spacing.sm },
    changeBtnText: { fontSize: 14, fontWeight: '600', color: colors.gray600 },
  })
}
