import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
  User,
  Store,
  MapPin,
  Phone,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';

export default function ProfileScreen() {
  const { retailer, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const menuItems = [
    {
      icon: Bell,
      title: 'Notification Settings',
      subtitle: 'Manage your notifications',
      onPress: () => {},
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp/SMS Configuration',
      subtitle: 'Configure messaging settings',
      onPress: () => {},
    },
    {
      icon: Settings,
      title: 'App Settings',
      subtitle: 'General app preferences',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Card style={styles.profileCard}>
            <View style={styles.avatar}>
              <User size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.name}>{retailer?.name}</Text>
            <Text style={styles.phone}>{retailer?.phone}</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Store size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>{retailer?.shop_name}</Text>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>{retailer?.location}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: theme.colors.primary + '15' },
                ]}
              >
                <item.icon size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integration Status</Text>
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <MessageSquare size={20} color={theme.colors.success} />
                <Text style={styles.statusText}>WhatsApp</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  retailer?.whatsapp_enabled
                    ? styles.enabledBadge
                    : styles.disabledBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    retailer?.whatsapp_enabled
                      ? styles.enabledText
                      : styles.disabledText,
                  ]}
                >
                  {retailer?.whatsapp_enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>

            <View style={[styles.statusRow, { marginTop: theme.spacing.md }]}>
              <View style={styles.statusInfo}>
                <MessageSquare size={20} color={theme.colors.secondary} />
                <Text style={styles.statusText}>SMS</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  retailer?.sms_enabled
                    ? styles.enabledBadge
                    : styles.disabledBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    retailer?.sms_enabled
                      ? styles.enabledText
                      : styles.disabledText,
                  ]}
                >
                  {retailer?.sms_enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
            textStyle={{ color: theme.colors.error }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  phone: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  menuSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusCard: {
    padding: theme.spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  enabledBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  disabledBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  statusBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  enabledText: {
    color: theme.colors.success,
  },
  disabledText: {
    color: theme.colors.error,
  },
  logoutButton: {
    marginBottom: theme.spacing.xl,
    borderColor: theme.colors.error,
  },
});
