import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Bell,
  Users,
  UserPlus,
  Settings,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { Notification } from '@/types/database';

type FilterType = 'all' | 'farmers' | 'customers' | 'system';

export default function NotificationsScreen() {
  const { retailer } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (retailer) {
      loadNotifications();
    }
  }, [retailer, filter]);

  const loadNotifications = async () => {
    if (!retailer) return;

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('retailer_id', retailer.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('recipient_type', filter === 'farmers' ? 'farmer' : filter === 'customers' ? 'customer' : 'system');
      }

      const { data, error } = await query;
      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!retailer) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('retailer_id', retailer.id)
        .eq('is_read', false);

      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'farmer':
        return <Users size={20} color={theme.colors.primary} />;
      case 'customer':
        return <UserPlus size={20} color={theme.colors.secondary} />;
      case 'system':
        return <Settings size={20} color={theme.colors.success} />;
      default:
        return <Bell size={20} color={theme.colors.textSecondary} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filters: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'farmers', label: 'Farmers' },
    { type: 'customers', label: 'Customers' },
    { type: 'system', label: 'System' },
  ];

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <Card
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                item.recipient_type === 'farmer'
                  ? theme.colors.primary + '20'
                  : item.recipient_type === 'customer'
                  ? theme.colors.secondary + '20'
                  : theme.colors.success + '20',
            },
          ]}
        >
          {getNotificationIcon(item.recipient_type)}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{formatTime(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <CheckCircle size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 24 }} />}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>{unreadCount} unread notifications</Text>
        </View>
      )}

      <View style={styles.filtersContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.type}
            style={[styles.filterButton, filter === f.type && styles.filterButtonActive]}
            onPress={() => setFilter(f.type)}
          >
            <Text
              style={[styles.filterText, filter === f.type && styles.filterTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You're all caught up! Notifications will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  unreadBanner: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  unreadText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  notificationCard: {
    marginBottom: theme.spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  notificationMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 3,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});
