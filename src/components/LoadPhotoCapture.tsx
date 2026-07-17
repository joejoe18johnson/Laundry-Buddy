import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { AppIcon } from './AppIcon'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

interface LoadPhotoCaptureProps {
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
}

export function LoadPhotoCapture({ photoUri, onPhotoChange }: LoadPhotoCaptureProps) {
  const pickPhoto = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        toTitleCase('Permission needed'),
        useCamera
          ? toTitleCase('Allow camera access to photograph your load.')
          : toTitleCase('Allow photo library access to choose a picture of your load.'),
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
    Alert.alert(toTitleCase('Load photo'), toTitleCase('Help your host see what you are dropping off.'), [
      { text: toTitleCase('Take photo'), onPress: () => pickPhoto(true) },
      { text: toTitleCase('Choose from library'), onPress: () => pickPhoto(false) },
      ...(photoUri ? [{ text: toTitleCase('Remove photo'), style: 'destructive' as const, onPress: () => onPhotoChange(null) }] : []),
      { text: toTitleCase('Cancel'), style: 'cancel' as const },
    ])
  }

  return (
    <View>
      <Pressable onPress={showOptions} style={[styles.upload, photoUri && styles.uploadDone]}>
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
      {photoUri && (
        <Pressable onPress={showOptions} style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>{toTitleCase('Change photo')}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
