import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { AppIcon } from './AppIcon'
import { BrandActionSheet, BrandAlert, type BrandDialogAction } from './BrandDialog'
import { useTheme } from '../context/ThemeContext'
import {
  formatDocumentFileName,
  inferMimeTypeFromUri,
  isImageMimeType,
  isPdfMimeType,
} from '../lib/verificationDocuments'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'

export type AddressProofFile = {
  uri: string
  mimeType: string
  name: string
}

interface AddressProofCaptureProps {
  file: AddressProofFile | null
  onFileChange: (file: AddressProofFile | null) => void
  label?: string
}

export function AddressProofCapture({ file, onFileChange, label }: AddressProofCaptureProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null)

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setAlert({
        title: 'Permission needed',
        message: useCamera
          ? 'Allow camera access to photograph your utility bill.'
          : 'Allow photo library access to choose your utility bill photo.',
      })
      return
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: false,
        })

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0]
      onFileChange({
        uri: asset.uri,
        mimeType: asset.mimeType ?? inferMimeTypeFromUri(asset.uri),
        name: asset.fileName ?? 'Utility bill photo',
      })
    }
  }

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    onFileChange({
      uri: asset.uri,
      mimeType: asset.mimeType ?? inferMimeTypeFromUri(asset.uri),
      name: asset.name ?? 'Utility bill',
    })
  }

  const sheetActions: BrandDialogAction[] = [
    {
      label: 'Take photo',
      icon: 'camera',
      variant: 'primary',
      onPress: () => {
        setSheetOpen(false)
        void pickImage(true)
      },
    },
    {
      label: 'Choose photo',
      icon: 'image',
      variant: 'outline',
      onPress: () => {
        setSheetOpen(false)
        void pickImage(false)
      },
    },
    {
      label: 'Choose PDF or file',
      icon: 'file-text',
      variant: 'outline',
      onPress: () => {
        setSheetOpen(false)
        void pickDocument()
      },
    },
    ...(file
      ? [
          {
            label: 'Remove file',
            icon: 'trash-2' as const,
            variant: 'danger' as const,
            onPress: () => {
              setSheetOpen(false)
              onFileChange(null)
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

  const isPdf = file ? isPdfMimeType(file.mimeType) : false
  const isImage = file ? isImageMimeType(file.mimeType) || !isPdf : false

  return (
    <View>
      <Pressable onPress={() => setSheetOpen(true)} style={[styles.upload, file && styles.uploadDone]}>
        {file && isImage ? (
          <Image source={{ uri: file.uri }} style={styles.preview} resizeMode="cover" />
        ) : file && isPdf ? (
          <View style={styles.pdfPreview}>
            <AppIcon name="file-text" size={28} color={colors.green} />
            <Text style={styles.pdfName}>{formatDocumentFileName(file.name, 'Utility bill.pdf')}</Text>
            <Text style={styles.pdfHint}>{toTitleCase('PDF ready to submit')}</Text>
          </View>
        ) : (
          <>
            <AppIcon name="upload" size={24} color={colors.gray500} />
            <Text style={styles.uploadText}>{label ?? toTitleCase('Upload utility bill or lease')}</Text>
            <Text style={styles.uploadHint}>{toTitleCase('Photo or PDF')}</Text>
          </>
        )}
      </Pressable>

      <BrandActionSheet
        visible={sheetOpen}
        title="Address proof"
        message="Upload a utility bill or lease in your name. Photos or PDF files are accepted."
        icon="home"
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
    uploadText: { fontSize: 15, fontWeight: '500', color: colors.gray500, textAlign: 'center' },
    uploadHint: { fontSize: 12, color: colors.gray500 },
    preview: { width: '100%', height: 180, borderRadius: radius.sm },
    pdfPreview: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
    pdfName: { fontSize: 14, fontWeight: '600', color: colors.black, textAlign: 'center' },
    pdfHint: { fontSize: 12, color: colors.green, fontWeight: '600' },
  })
}
