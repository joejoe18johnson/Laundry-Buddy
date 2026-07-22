import * as ImagePicker from 'expo-image-picker'
import { beginCameraSession, endCameraSession } from './cameraSession'
import type { Screen } from '../types'

export type ImagePickSource = 'camera' | 'library'

export type ImagePickResult =
  | { ok: true; uri: string; mimeType?: string | null; fileName?: string | null }
  | { ok: false; reason: 'canceled' | 'permission_denied' }

export async function pickImage(
  source: ImagePickSource,
  options?: { quality?: number; returnScreen?: Screen },
): Promise<ImagePickResult> {
  beginCameraSession(options?.returnScreen)
  try {
    const useCamera = source === 'camera'
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      return { ok: false, reason: 'permission_denied' }
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: options?.quality ?? 0.7,
      allowsEditing: false,
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions)

    if (result.canceled || !result.assets[0]?.uri) {
      return { ok: false, reason: 'canceled' }
    }

    const asset = result.assets[0]
    return {
      ok: true,
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    }
  } finally {
    endCameraSession()
  }
}
