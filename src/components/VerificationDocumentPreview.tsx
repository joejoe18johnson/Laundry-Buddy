import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import {
  formatDocumentFileName,
  inferMimeTypeFromUri,
  isImageMimeType,
  isPdfMimeType,
} from '../lib/verificationDocuments'
import { toTitleCase } from '../lib/titleCase'
import { useTheme } from '../context/ThemeContext'
import { radius, spacing } from '../theme'

type VerificationDocumentPreviewProps = {
  uri: string
  mimeType?: string
  name?: string
  label?: string
  onViewImage?: (uri: string) => void
}

export function VerificationDocumentPreview({
  uri,
  mimeType,
  name,
  label,
  onViewImage,
}: VerificationDocumentPreviewProps) {
  const { colors } = useTheme()
  const resolvedMime = mimeType ?? inferMimeTypeFromUri(uri)
  const isPdf = isPdfMimeType(resolvedMime)
  const isImage = isImageMimeType(resolvedMime) || !isPdf

  const openPdf = () => {
    Linking.openURL(uri).catch(() => {})
  }

  if (isPdf) {
    return (
      <View style={styles.section}>
        {label ? <Text style={[styles.docLabel, { color: colors.gray600 }]}>{toTitleCase(label)}</Text> : null}
        <Pressable
          onPress={openPdf}
          style={[styles.pdfCard, { borderColor: colors.gray200, backgroundColor: colors.gray50 }]}
        >
          <AppIcon name="file-text" size={24} color={colors.black} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pdfName, { color: colors.black }]}>
              {formatDocumentFileName(name, 'Document.pdf')}
            </Text>
            <Text style={[styles.pdfAction, { color: colors.gray600 }]}>{toTitleCase('Tap to open PDF')}</Text>
          </View>
          <AppIcon name="external-link" size={18} color={colors.gray500} />
        </Pressable>
      </View>
    )
  }

  if (!isImage) return null

  return (
    <View style={styles.section}>
      {label ? <Text style={[styles.docLabel, { color: colors.gray600 }]}>{toTitleCase(label)}</Text> : null}
      <Pressable
        onPress={() => onViewImage?.(uri)}
        style={[styles.docPreview, { borderColor: colors.gray200, backgroundColor: colors.gray50 }]}
      >
        <Image source={{ uri }} style={styles.docImage} resizeMode="cover" />
        <View style={styles.docOverlay}>
          <AppIcon name="maximize-2" size={18} color={colors.white} />
          <Text style={styles.docOverlayText}>{toTitleCase('Tap to view full size')}</Text>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  docLabel: { fontSize: 12, fontWeight: '600', marginTop: spacing.sm },
  docPreview: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 180,
  },
  docImage: { width: '100%', height: 220 },
  docOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  docOverlayText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pdfName: { fontSize: 14, fontWeight: '600' },
  pdfAction: { fontSize: 12, marginTop: 2 },
})
