import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { AppIcon } from './AppIcon'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

interface IdDocumentCaptureProps {
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
  label?: string
}

export function IdDocumentCapture({ photoUri, onPhotoChange, label }: IdDocumentCaptureProps) {
  const pickPhoto = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        toTitleCase('Permission needed'),
        useCamera
          ? toTitleCase('Allow camera access to photograph your ID.')
          : toTitleCase('Allow photo library access to choose your ID photo.'),
      )
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
      onPhotoChange(result.assets[0].uri)
    }
  }

  const showOptions = () => {
    Alert.alert(
      toTitleCase('ID photo'),
      toTitleCase('Upload a clear photo of your passport, driver\'s license, or social security card.'),
      [
        { text: toTitleCase('Take photo'), onPress: () => pickPhoto(true) },
        { text: toTitleCase('Choose from library'), onPress: () => pickPhoto(false) },
        ...(photoUri
          ? [{ text: toTitleCase('Remove photo'), style: 'destructive' as const, onPress: () => onPhotoChange(null) }]
          : []),
        { text: toTitleCase('Cancel'), style: 'cancel' as const },
      ],
    )
  }

  return (
    <View>
      <Pressable onPress={showOptions} style={[styles.upload, photoUri && styles.uploadDone]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <>
            <AppIcon name="upload" size={24} color={colors.gray500} />
            <Text style={styles.uploadText}>{label ?? toTitleCase('Upload ID photo')}</Text>
          </>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
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
  uploadText: { fontSize: 15, fontWeight: '500', color: colors.gray500 },
  preview: { width: '100%', height: 180, borderRadius: radius.sm },
})
