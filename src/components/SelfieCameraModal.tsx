import { useMemo, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { SelfieFrameGuide } from './SelfieFrameGuide'
import { useTheme } from '../context/ThemeContext'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  visible: boolean
  onClose: () => void
  onCapture: (uri: string) => void
}

export function SelfieCameraModal({ visible, onClose, onCapture }: Props) {
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [capturing, setCapturing] = useState(false)
  const { colors: themeColors } = useTheme()
  const styles = useMemo(() => createStyles(themeColors), [themeColors])

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return
    setCapturing(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      })
      if (photo?.uri) {
        onCapture(photo.uri)
        onClose()
      }
    } finally {
      setCapturing(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission?.granted ? (
          <SafeAreaView style={styles.permissionWrap}>
            <Text style={styles.permissionTitle}>{toTitleCase('Camera access needed')}</Text>
            <Text style={styles.permissionBody}>
              {toTitleCase('Allow camera access to take your verification selfie with the face guide.')}
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => void requestPermission()}>
              <Text style={styles.primaryBtnText}>{toTitleCase('Allow camera')}</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={onClose}>
              <Text style={styles.ghostBtnText}>{toTitleCase('Cancel')}</Text>
            </Pressable>
          </SafeAreaView>
        ) : (
          <>
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
            <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
              <View style={styles.topBar}>
                <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
                  <AppIcon name="x" size={22} color={colors.white} />
                </Pressable>
                <Text style={styles.title}>{toTitleCase('Verification selfie')}</Text>
                <View style={styles.closeBtn} />
              </View>

              <View style={styles.guideArea}>
                <SelfieFrameGuide
                  light
                  label="Center your face in the oval — good lighting, no hat or sunglasses"
                />
              </View>

              <View style={styles.bottomBar}>
                <Pressable
                  style={[styles.shutter, capturing && styles.shutterDisabled]}
                  onPress={() => void handleCapture()}
                  disabled={capturing}
                >
                  <View style={styles.shutterInner} />
                </Pressable>
              </View>
            </SafeAreaView>
          </>
        )}
      </View>
    </Modal>
  )
}

function createStyles(themeColors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.black },
    camera: { flex: 1 },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'space-between',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
    },
    guideArea: {
      flex: 1,
      marginHorizontal: spacing.lg,
    },
    bottomBar: {
      alignItems: 'center',
      paddingBottom: spacing.xl,
    },
    shutter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 4,
      borderColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    shutterDisabled: { opacity: 0.6 },
    shutterInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.white,
    },
    permissionWrap: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
      backgroundColor: themeColors.white,
    },
    permissionTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: themeColors.black,
      textAlign: 'center',
    },
    permissionBody: {
      fontSize: 15,
      color: themeColors.gray600,
      lineHeight: 22,
      textAlign: 'center',
    },
    primaryBtn: {
      backgroundColor: themeColors.black,
      borderRadius: radius.pill,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
    ghostBtn: { alignItems: 'center', paddingVertical: spacing.sm },
    ghostBtnText: { color: themeColors.gray600, fontSize: 15, fontWeight: '600' },
  })
}
