import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { ACTIVE_REGION_LABEL } from '../../data/mockData'
import { colors, radius, spacing } from '../../theme'

const SUPPORT_PHONE = '5016220000'
const SUPPORT_EMAIL = 'help@laundrybuddy.bz'

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <View style={styles.faq}>
      <Text style={styles.faqQ}>{question}</Text>
      <Text style={styles.faqA}>{answer}</Text>
    </View>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{body}</Text>
      </View>
    </View>
  )
}

export function HelpScreen() {
  const { user } = useAuth()
  const { navigate } = useApp()

  if (!user) return null

  const isCustomer = user.role === 'customer'
  const backScreen = isCustomer ? 'customer-home' : 'host-dashboard'

  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${SUPPORT_PHONE}?text=Hi%20Laundry%20Buddy%20—%20I%20need%20help`).catch(
      () => {},
    )
  }

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Laundry%20Buddy%20support`).catch(() => {})
  }

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label="Back" />
      <View style={styles.titleRow}>
        <AppIcon name="help-circle" size={22} />
        <Text style={styles.title}>Help & support</Text>
      </View>
      <Text style={styles.subtitle}>
        {isCustomer
          ? 'How to book a neighbor’s dryer in the Cayo Area'
          : 'Build your reputation — every load logged on the app counts'}
      </Text>

      {!isCustomer && (
        <View style={styles.reputationBanner}>
          <AppIcon name="award" size={20} color={colors.black} />
          <View style={styles.reputationText}>
            <Text style={styles.reputationTitle}>Laundry Buddy is about reputation</Text>
            <Text style={styles.reputationBody}>
              Record every sale on the app. The more loads you complete here, the higher you appear in guest
              searches. Off-platform deals hurt your visibility and your trust score.
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.section}>How it works</Text>
      {isCustomer ? (
        <>
          <Step n={1} title="Find a host" body={`Search by area, price, or reviews in ${ACTIVE_REGION_LABEL}.`} />
          <Step n={2} title="Book a slot" body="Pick drop-off time, load count, and any notes for the host." />
          <Step n={3} title="Track your load" body="Follow each stage from bag received to ready for pickup." />
          <Step n={4} title="Pick up dry laundry" body="Message your host on WhatsApp if you need directions or timing." />
        </>
      ) : (
        <>
          <Step n={1} title="Go online" body="Turn on your availability so guests can find you in search." />
          <Step n={2} title="Accept & update loads" body="Accept requests and mark each stage until the load is ready." />
          <Step n={3} title="Record every sale" body="Log every completed load on the app — cash or bank transfer. This builds your reputation." />
          <Step n={4} title="Earn visibility" body="More completed loads and reviews help you appear higher when guests search." />
        </>
      )}

      <Text style={styles.section}>{isCustomer ? 'Common questions' : 'Host FAQ — reputation & sales'}</Text>
      <View style={styles.faqCard}>
        {isCustomer ? (
          <>
            <FaqItem
              question="Is payment handled in the app?"
              answer="Hosts set their price per load. Pay your host directly unless they say otherwise."
            />
            <FaqItem
              question="What if it rains?"
              answer="Use covered drop-off spots when possible. Check the weather banner on Explore."
            />
            <FaqItem
              question="Can I book multiple loads?"
              answer="Yes — increase the load count when booking a standard basket size."
            />
          </>
        ) : (
          <>
            <FaqItem
              question="Why should I record all my sales on the app?"
              answer="Every load you log adds to your reputation — reviews, completed count, and trust signals guests look for. Laundry Buddy is built on reputation, not one-off deals. Hosts who keep accurate records get more repeat bookings."
            />
            <FaqItem
              question="Does logging more loads help me show up in search?"
              answer="Yes. The more loads you complete and record on Laundry Buddy, the more visible you become to guests browsing nearby. Active hosts with a strong on-app history rank higher in search results than hosts who go quiet or skip logging."
            />
            <FaqItem
              question="Can I arrange bookings or payment outside the app?"
              answer="Please don’t. Off-platform deals bypass reviews, leave no record if something goes wrong, and hurt your standing on Laundry Buddy. Always accept bookings through the app and mark loads complete when done — whether the guest pays cash or bank transfer."
            />
            <FaqItem
              question="What if a guest asks to pay me directly to skip the app?"
              answer="Politely decline and point them to your Laundry Buddy listing. Deals outside the site don’t count toward your reputation and may result in fewer search impressions. Guests who book through the app can still pay cash or transfer — you just keep everything documented here."
            />
            <FaqItem
              question="How do I pause new requests?"
              answer="Go offline in your profile or use Accepting loads on your dashboard when you are full or away. Finish and log any active loads first so your record stays accurate."
            />
            <FaqItem
              question="What if power goes out?"
              answer="Message guests right away. Generator hosts should note that on their listing. Update the load stage in the app so guests stay informed."
            />
          </>
        )}
      </View>

      <Text style={styles.section}>Contact us</Text>
      <Pressable style={styles.contactBtn} onPress={openWhatsApp}>
        <AppIcon name="message-circle" size={18} />
        <Text style={styles.contactLabel}>WhatsApp support</Text>
        <AppIcon name="chevron-right" size={18} color={colors.gray400} />
      </Pressable>
      <Pressable style={styles.contactBtn} onPress={openEmail}>
        <AppIcon name="mail" size={18} />
        <Text style={styles.contactLabel}>{SUPPORT_EMAIL}</Text>
        <AppIcon name="chevron-right" size={18} color={colors.gray400} />
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  reputationBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.gray50,
  },
  reputationText: { flex: 1, gap: spacing.sm },
  reputationTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  reputationBody: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  section: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md, marginTop: spacing.sm },
  step: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 15, fontWeight: '600' },
  stepDesc: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  faqCard: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  faq: { gap: spacing.sm },
  faqQ: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  faqA: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
})
