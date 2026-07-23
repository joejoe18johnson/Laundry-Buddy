import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { ACTIVE_REGION_LABEL } from '../../data/mockData'
import { SUPPORT_EMAIL } from '../../lib/supportContact'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'

function createHelpStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
    contactLabel: { fontSize: 15, fontWeight: '600' },
    contactCopy: { flex: 1, gap: 2 },
    contactSub: { fontSize: 13, fontWeight: '500', color: colors.gray500 },
  })
}

function FaqItem({
  question,
  answer,
  styles,
}: {
  question: string
  answer: string
  styles: ReturnType<typeof createHelpStyles>
}) {
  return (
    <View style={styles.faq}>
      <Text style={styles.faqQ}>{toTitleCase(question)}</Text>
      <Text style={styles.faqA}>{toTitleCase(answer)}</Text>
    </View>
  )
}

function Step({
  n,
  title,
  body,
  styles,
}: {
  n: number
  title: string
  body: string
  styles: ReturnType<typeof createHelpStyles>
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{toTitleCase(title)}</Text>
        <Text style={styles.stepDesc}>{toTitleCase(body)}</Text>
      </View>
    </View>
  )
}

export function HelpScreen() {
  const { user } = useAuth()
  const { navigate, openSupportChat } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createHelpStyles(colors), [colors])

  if (!user) return null

  const isCustomer = user.role === 'customer'
  const backScreen = isCustomer ? 'customer-home' : 'host-dashboard'

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label="Back" />
      <View style={styles.titleRow}>
        <AppIcon name="help-circle" size={22} />
        <Text style={styles.title}>{toTitleCase('Help & support')}</Text>
      </View>
      <Text style={styles.subtitle}>
        {isCustomer
          ? toTitleCase('How to book a neighbor’s dryer anywhere in Belize')
          : toTitleCase('Build your reputation — every load logged on the app counts')}
      </Text>

      {!isCustomer && (
        <View style={styles.reputationBanner}>
          <AppIcon name="award" size={20} color={colors.black} />
          <View style={styles.reputationText}>
            <Text style={styles.reputationTitle}>{toTitleCase('Laundry Buddy is about reputation')}</Text>
            <Text style={styles.reputationBody}>
              {toTitleCase(
                'Record every sale on the app. The more loads you complete here, the higher you appear in guest searches. Off-platform deals hurt your visibility and your trust score.',
              )}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.section}>{toTitleCase('How it works')}</Text>
      {isCustomer ? (
        <>
          <Step n={1} title="Find a host" body={`Search by district, town, price, or reviews anywhere in ${ACTIVE_REGION_LABEL}.`} styles={styles} />
          <Step n={2} title="Send a request" body="Pick drop-off time, load count, and any notes for the host." styles={styles} />
          <Step n={3} title="Track your load" body="Follow each stage from bag received to ready for pickup." styles={styles} />
          <Step n={4} title="Pick up dry laundry" body="Message your host in the app if you need directions or timing." styles={styles} />
        </>
      ) : (
        <>
          <Step n={1} title="Go online" body="Turn on your availability so guests can find you in search." styles={styles} />
          <Step n={2} title="Accept & update loads" body="Accept requests and mark each stage until the load is ready." styles={styles} />
          <Step n={3} title="Record every sale" body="Log every completed load on the app — cash or bank transfer. This builds your reputation." styles={styles} />
          <Step n={4} title="Earn visibility" body="More completed loads and reviews help you appear higher when guests search." styles={styles} />
        </>
      )}

      <Text style={styles.section}>
        {toTitleCase(isCustomer ? 'Common questions' : 'Host FAQ — reputation & sales')}
      </Text>
      <View style={styles.faqCard}>
        {isCustomer ? (
          <>
            <FaqItem
              question="Is payment handled in the app?"
              answer="Hosts set their price per load. After your host accepts, open My loads for bank details — transfer and submit your receipt there. Cash loads are paid at drop-off when you bring your laundry."
              styles={styles}
            />
            <FaqItem
              question="What if it rains?"
              answer="Use covered drop-off spots when possible. Check the weather banner on Explore."
              styles={styles}
            />
            <FaqItem
              question="Can I message a host before booking?"
              answer="Yes — open a host profile and tap Message host to plan drop-off timing, gate access, or ask about availability before you book."
              styles={styles}
            />
            <FaqItem
              question="Can I book multiple loads?"
              answer="Yes — increase the load count when booking a standard basket size."
              styles={styles}
            />
          </>
        ) : (
          <>
            <FaqItem
              question="Why should I record all my sales on the app?"
              answer="Every load you log adds to your reputation — reviews, completed count, and trust signals guests look for. Laundry Buddy is built on reputation, not one-off deals. Hosts who keep accurate records get more repeat bookings."
              styles={styles}
            />
            <FaqItem
              question="Does logging more loads help me show up in search?"
              answer="Yes. The more loads you complete and record on Laundry Buddy, the more visible you become to guests browsing nearby. Active hosts with a strong on-app history rank higher in search results than hosts who go quiet or skip logging."
              styles={styles}
            />
            <FaqItem
              question="Can I arrange bookings or payment outside the app?"
              answer="Please don’t. Off-platform deals bypass reviews, leave no record if something goes wrong, and hurt your standing on Laundry Buddy. Always accept bookings through the app and mark loads complete when done — whether the guest pays cash or bank transfer."
              styles={styles}
            />
            <FaqItem
              question="What if a guest asks to pay me directly to skip the app?"
              answer="Politely decline and point them to your Laundry Buddy listing. Deals outside the site don’t count toward your reputation and may result in fewer search impressions. Guests who book through the app can still pay cash or transfer — you just keep everything documented here."
              styles={styles}
            />
            <FaqItem
              question="How do I pause new requests?"
              answer="Go offline in your profile or use Accepting loads on your dashboard when you are full or away. Finish and log any active loads first so your record stays accurate."
              styles={styles}
            />
            <FaqItem
              question="What if power goes out?"
              answer="Message guests right away. Generator hosts should note that on their listing. Update the load stage in the app so guests stay informed."
              styles={styles}
            />
          </>
        )}
      </View>

      <Text style={styles.section}>{toTitleCase('Contact us')}</Text>
      <Pressable style={styles.contactBtn} onPress={openSupportChat}>
        <AppIcon name="message-circle" size={18} />
        <View style={styles.contactCopy}>
          <Text style={styles.contactLabel}>{toTitleCase('In-app support chat')}</Text>
          <Text style={styles.contactSub}>{toTitleCase('Message our team without leaving the app')}</Text>
        </View>
        <AppIcon name="chevron-right" size={18} color={colors.gray400} />
      </Pressable>
      <View style={styles.contactBtn}>
        <AppIcon name="mail" size={18} />
        <View style={styles.contactCopy}>
          <Text style={styles.contactLabel}>{SUPPORT_EMAIL}</Text>
          <Text style={styles.contactSub}>{toTitleCase('Use in-app chat for the fastest reply')}</Text>
        </View>
      </View>

      <Text style={styles.section}>{toTitleCase('Legal')}</Text>
      <Pressable style={styles.contactBtn} onPress={() => navigate('terms')}>
        <AppIcon name="file-text" size={18} />
        <View style={styles.contactCopy}>
          <Text style={styles.contactLabel}>{toTitleCase('Terms and conditions')}</Text>
          <Text style={styles.contactSub}>{toTitleCase('Rules for using Laundry Buddy')}</Text>
        </View>
        <AppIcon name="chevron-right" size={18} color={colors.gray400} />
      </Pressable>
      <Pressable style={styles.contactBtn} onPress={() => navigate('privacy')}>
        <AppIcon name="shield" size={18} />
        <View style={styles.contactCopy}>
          <Text style={styles.contactLabel}>{toTitleCase('Privacy policy')}</Text>
          <Text style={styles.contactSub}>{toTitleCase('How we handle your information')}</Text>
        </View>
        <AppIcon name="chevron-right" size={18} color={colors.gray400} />
      </Pressable>
    </Screen>
  )
}
