import { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useApp } from '../context/AppContext'
import type { Host } from '../types'
import { colors, coverColors, radius, spacing } from '../theme'
import { AppIcon } from './AppIcon'
import { PrimaryButton } from './ui'

export function HostCard({ host }: { host: Host }) {
  const { selectHost } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const gradient = coverColors[host.id] ?? ['#667eea', '#764ba2']

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <LinearGradient colors={gradient} style={styles.cover} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.badge}>
            <AppIcon name="gift" size={12} />
            <Text style={styles.badgeText}>Free</Text>
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.body}>
        <Pressable onPress={() => setExpanded(!expanded)}>
          <View style={styles.row}>
            <View style={styles.titleRow}>
              <AppIcon name="map-pin" size={16} color={colors.black} />
              <Text style={styles.title}>{host.location}</Text>
            </View>
            <View style={styles.ratingRow}>
              <AppIcon name="star" size={14} color={colors.black} />
              <Text style={styles.rating}>
                {host.rating > 0 ? host.rating.toFixed(1) : 'New'}
                {host.reviewCount ? ` (${host.reviewCount})` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <AppIcon name="user" size={14} color={colors.gray500} />
            <Text style={styles.subtitle}>Hosted by {host.name}</Text>
          </View>
          <View style={styles.metaRow}>
            <AppIcon name="clock" size={14} color={colors.gray500} />
            <Text style={styles.meta}>
              {host.slotsLeft} slots · ~{host.turnaroundHours} hr · {host.dryerType}
              {host.distanceKm != null ? ` · ${host.distanceKm} km` : ''}
            </Text>
          </View>
          <View style={styles.tags}>
            {host.hasGenerator && (
              <Pressable onPress={() => setShowGenerator(true)} style={styles.tagAccent}>
                <AppIcon name="zap" size={12} />
                <Text style={styles.tagAccentText}>Generator</Text>
              </Pressable>
            )}
            {host.foldingExtra != null && (
              <View style={styles.tag}>
                <AppIcon name="layers" size={12} color={colors.gray600} />
                <Text style={styles.tagText}>Folding +${host.foldingExtra}</Text>
              </View>
            )}
          </View>
        </Pressable>

        {expanded && (
          <View style={styles.expanded}>
            <Text style={styles.expandedLabel}>Setup</Text>
            {host.photos.map((p) => (
              <Text key={p} style={styles.expandedItem}>· {p}</Text>
            ))}
            <Text style={[styles.expandedLabel, { marginTop: 12 }]}>House rules</Text>
            {host.rules.map((r) => (
              <Text key={r} style={styles.expandedItem}>· {r}</Text>
            ))}
          </View>
        )}

        <PrimaryButton title="Book slot" icon="calendar" onPress={() => selectHost(host)} full />
      </View>

      <Modal visible={showGenerator} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenerator(false)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Generator backup</Text>
            <Text style={styles.modalBody}>
              Works during BEL power outages — your load keeps drying when the grid goes down.
            </Text>
            <PrimaryButton title="Got it" onPress={() => setShowGenerator(false)} full />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.xl },
  cover: { height: 180, borderRadius: radius.lg, justifyContent: 'flex-start', padding: spacing.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  body: { paddingTop: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  title: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 14, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subtitle: { fontSize: 14, color: colors.gray500, lineHeight: 20, flex: 1 },
  meta: { fontSize: 14, color: colors.gray500, lineHeight: 20, flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 12, color: colors.gray600 },
  tagAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagAccentText: { fontSize: 12, fontWeight: '500' },
  expanded: { borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: spacing.md, marginTop: spacing.sm },
  expandedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  expandedItem: { fontSize: 14, color: colors.gray600, paddingVertical: spacing.sm, lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, textAlign: 'center' },
  modalBody: { fontSize: 15, color: colors.gray500, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 24 },
})
