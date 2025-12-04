import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, UserPlus } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { Customer } from '@/types/database';

export default function CustomersScreen() {
  const { retailer } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (retailer) {
      loadCustomers();
    }
  }, [retailer]);

  const loadCustomers = async () => {
    if (!retailer) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('retailer_id', retailer.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <Card style={styles.customerCard} onPress={() => {}}>
      <View style={styles.customerHeader}>
        <View style={styles.customerAvatar}>
          <UserPlus size={24} color={theme.colors.secondary} />
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerId}>ID: {item.customer_code}</Text>
        </View>
        <View
          style={[
            styles.paymentTypeBadge,
            item.payment_type === 'daily'
              ? styles.dailyBadge
              : styles.onDemandBadge,
          ]}
        >
          <Text style={styles.paymentTypeText}>
            {item.payment_type === 'daily' ? 'Daily' : 'On-Demand'}
          </Text>
        </View>
      </View>
      <View style={styles.customerStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Today's Purchase</Text>
          <Text style={styles.statValue}>-- kg</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Pending Dues</Text>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>
            ₹{item.pending_dues.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.customerFooter}>
        <Text style={styles.lastPurchase}>
          Last Purchase: {item.last_purchase_date || 'N/A'}
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <UserPlus size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>Add your first customer to get started</Text>
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
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  addButton: {
    backgroundColor: theme.colors.secondary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  customerCard: {
    marginBottom: theme.spacing.md,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  customerId: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  paymentTypeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  dailyBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  onDemandBadge: {
    backgroundColor: theme.colors.warning + '20',
  },
  paymentTypeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  customerStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  customerFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  lastPurchase: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
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
  },
});
