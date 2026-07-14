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
            <Text style={styles.badgeText}>Free</Text>
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.body}>
        <Pressable onPress={() => setExpanded(!expanded)}>
          <View style={styles.row}>
            <Text style={styles.title}>{host.location}</Text>
            <Text style={styles.rating}>
              ★ {host.rating > 0 ? host.rating.toFixed(1) : 'New'}
              {host.reviewCount ? ` (${host.reviewCount})` : ''}
            </Text>
          </View>
          <Text style={styles.subtitle}>Hosted by {host.name}</Text>
          <Text style={styles.meta}>
            {host.slotsLeft} slots · ~{host.turnaroundHours} hr · {host.dryerType}
            {host.distanceKm != null ? ` · ${host.distanceKm} km` : ''}
          </Text>
          <View style={styles.tags}>
            {host.hasGenerator && (
              <Pressable onPress={() => setShowGenerator(true)} style={styles.tagAccent}>
                <Text style={styles.tagAccentText}>Generator</Text>
              </Pressable>
            )}
            {host.foldingExtra != null && (
              <View style={styles.tag}>
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

        <PrimaryButton title="Book slot" onPress={() => selectHost(host)} full />
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
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  body: { paddingTop: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  rating: { fontSize: 14, fontWeight: '500' },
  subtitle: { fontSize: 14, color: colors.gray500, marginTop: spacing.sm, lineHeight: 20 },
  meta: { fontSize: 14, color: colors.gray500, marginTop: spacing.sm, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tag: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 12, color: colors.gray600 },
  tagAccent: {
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
