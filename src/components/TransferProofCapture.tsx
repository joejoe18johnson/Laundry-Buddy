import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { AppIcon } from './AppIcon'
import { colors, radius, spacing } from '../theme'

interface TransferProofCaptureProps {
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
}

export function TransferProofCapture({ photoUri, onPhotoChange }: TransferProofCaptureProps) {
  const pickPhoto = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        useCamera
          ? 'Allow camera access to photograph your transfer receipt.'
          : 'Allow photo library access to choose your transfer screenshot.',
      )
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

  const showOptions = () => {
    Alert.alert('Transfer proof', 'Add a screenshot or photo of your bank transfer.', [
      { text: 'Take photo', onPress: () => pickPhoto(true) },
      { text: 'Choose screenshot', onPress: () => pickPhoto(false) },
      ...(photoUri
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => onPhotoChange(null) }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ])
  }

  return (
    <View>
      <Pressable onPress={showOptions} style={[styles.upload, photoUri && styles.uploadDone]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <>
            <AppIcon name="image" size={28} color={colors.gray500} />
            <Text style={styles.uploadText}>Add transfer screenshot</Text>
            <Text style={styles.uploadHint}>Bank app receipt or transfer confirmation</Text>
          </>
        )}
      </Pressable>
      {photoUri && (
        <Pressable onPress={showOptions} style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>Change screenshot</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
