import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { BrandActionSheet, BrandAlert, type BrandDialogAction } from './BrandDialog'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { pickImage } from '../lib/imagePicker'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'

interface TransferProofCaptureProps {
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
}

export function TransferProofCapture({ photoUri, onPhotoChange }: TransferProofCaptureProps) {
  const { screen, restoreAfterCamera } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null)

  const pickPhoto = async (useCamera: boolean) => {
    const result = await pickImage(useCamera ? 'camera' : 'library', {
      quality: 0.8,
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
          ? 'Allow camera access to photograph your transfer receipt.'
          : 'Allow photo library access to choose your transfer screenshot.',
      })
    }
  }
