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
  MessageSquare,
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { MessageLog } from '@/types/database';

type FilterType = 'all' | 'farmer' | 'customer';
type MessageType = 'all' | 'sms' | 'whatsapp';

export default function MessagesScreen() {
  const { retailer } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [recipientFilter, setRecipientFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<MessageType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (retailer) {
      loadMessages();
    }
  }, [retailer, recipientFilter, typeFilter]);

  const loadMessages = async () => {
    if (!retailer) return;

    try {
      let query = supabase
        .from('message_logs')
        .select('*')
        .eq('retailer_id', retailer.id)
        .order('sent_at', { ascending: false });

      if (recipientFilter !== 'all') {
        query = query.eq('recipient_type', recipientFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('message_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={16} color={theme.colors.success} />;
      case 'failed':
        return <XCircle size={16} color={theme.colors.error} />;
      case 'sent':
        return <Send size={16} color={theme.colors.warning} />;
      default:
        return <Clock size={16} color={theme.colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return theme.colors.success;
      case 'failed':
        return theme.colors.error;
      case 'sent':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
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

  const recipientFilters: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'farmer', label: 'Farmers' },
    { type: 'customer', label: 'Customers' },
  ];

  const typeFilters: { type: MessageType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'sms', label: 'SMS' },
    { type: 'whatsapp', label: 'WhatsApp' },
  ];

  const stats = {
    total: messages.length,
    delivered: messages.filter((m) => m.delivery_status === 'delivered').length,
    failed: messages.filter((m) => m.delivery_status === 'failed').length,
  };

  const renderMessageItem = ({ item }: { item: MessageLog }) => (
    <Card style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <View style={styles.recipientInfo}>
          <View
            style={[
              styles.recipientIcon,
              {
                backgroundColor:
                  item.recipient_type === 'farmer'
                    ? theme.colors.primary + '20'
                    : theme.colors.secondary + '20',
              },
            ]}
          >
            {item.recipient_type === 'farmer' ? (
              <Users size={16} color={theme.colors.primary} />
            ) : (
              <UserPlus size={16} color={theme.colors.secondary} />
            )}
          </View>
          <View style={styles.recipientDetails}>
            <Text style={styles.phoneNumber}>{item.phone_number}</Text>
            <Text style={styles.recipientType}>
              {item.recipient_type === 'farmer' ? 'Farmer' : 'Customer'}
            </Text>
          </View>
        </View>
        <View style={styles.messageTypeContainer}>
          <MessageSquare
            size={14}
            color={item.message_type === 'whatsapp' ? '#25D366' : theme.colors.primary}
          />
          <Text
            style={[
              styles.messageTypeText,
              {
                color:
                  item.message_type === 'whatsapp' ? '#25D366' : theme.colors.primary,
              },
            ]}
          >
            {item.message_type === 'whatsapp' ? 'WhatsApp' : 'SMS'}
          </Text>
        </View>
      </View>

      <Text style={styles.messageContent} numberOfLines={2}>
        {item.message_content}
      </Text>

      <View style={styles.messageFooter}>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.delivery_status)}
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.delivery_status) },
            ]}
          >
            {item.delivery_status === 'delivered'
              ? 'Delivered'
              : item.delivery_status === 'failed'
              ? 'Failed'
              : 'Sent'}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatTime(item.sent_at)}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Message Log</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {stats.delivered}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>
            {stats.failed}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      <View style={styles.filtersSection}>
        <Text style={styles.filterLabel}>Recipient Type:</Text>
        <View style={styles.filtersContainer}>
          {recipientFilters.map((f) => (
            <TouchableOpacity
              key={f.type}
              style={[
                styles.filterButton,
                recipientFilter === f.type && styles.filterButtonActive,
              ]}
              onPress={() => setRecipientFilter(f.type)}
            >
              <Text
                style={[
                  styles.filterText,
                  recipientFilter === f.type && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.filterLabel, { marginTop: theme.spacing.sm }]}>
          Message Type:
        </Text>
        <View style={styles.filtersContainer}>
          {typeFilters.map((f) => (
            <TouchableOpacity
              key={f.type}
              style={[
                styles.filterButton,
                typeFilter === f.type && styles.filterButtonActive,
              ]}
              onPress={() => setTypeFilter(f.type)}
            >
              <Text
                style={[
                  styles.filterText,
                  typeFilter === f.type && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageSquare size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No messages sent yet</Text>
            <Text style={styles.emptySubtext}>
              Message history will appear here once you start sending notifications
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  filtersSection: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  filtersContainer: {
    flexDirection: 'row',
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
  messageCard: {
    marginBottom: theme.spacing.md,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  recipientDetails: {
    justifyContent: 'center',
  },
  phoneNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  recipientType: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  messageTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
  },
  messageTypeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  messageContent: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
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
