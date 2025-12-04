import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { CreditCard, Users, UserPlus, Clock, CheckCircle } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function PaymentsScreen() {
  const { retailer } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [farmersPending, setFarmersPending] = useState(0);
  const [customersPending, setCustomersPending] = useState(0);

  useEffect(() => {
    if (retailer) {
      loadPaymentStats();
    }
  }, [retailer]);

  const loadPaymentStats = async () => {
    if (!retailer) return;

    try {
      const { data: farmers } = await supabase
        .from('farmers')
        .select('outstanding_amount')
        .eq('retailer_id', retailer.id);

      const { data: customers } = await supabase
        .from('customers')
        .select('pending_dues')
        .eq('retailer_id', retailer.id);

      const farmerTotal = farmers?.reduce((sum, f) => sum + Number(f.outstanding_amount), 0) || 0;
      const customerTotal = customers?.reduce((sum, c) => sum + Number(c.pending_dues), 0) || 0;

      setFarmersPending(farmerTotal);
      setCustomersPending(customerTotal);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentStats();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <Card style={styles.overviewCard}>
              <View
                style={[
                  styles.overviewIcon,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <Users size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.overviewLabel}>Farmers Pending</Text>
              <Text style={[styles.overviewValue, { color: theme.colors.primary }]}>
                ₹{farmersPending.toFixed(2)}
              </Text>
            </Card>
            <Card style={styles.overviewCard}>
              <View
                style={[
                  styles.overviewIcon,
                  { backgroundColor: theme.colors.secondary + '20' },
                ]}
              >
                <UserPlus size={24} color={theme.colors.secondary} />
              </View>
              <Text style={styles.overviewLabel}>Customers Pending</Text>
              <Text style={[styles.overviewValue, { color: theme.colors.secondary }]}>
                ₹{customersPending.toFixed(2)}
              </Text>
            </Card>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farmer Payments</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Clock size={20} color={theme.colors.primary} />
              <Text style={styles.infoTitle}>15-Day Payment Cycle</Text>
            </View>
            <Text style={styles.infoText}>
              Farmer payments are settled every 15 days. View pending payments and generate
              settlement slips.
            </Text>
            <TouchableOpacity style={styles.infoButton}>
              <Text style={styles.infoButtonText}>View Pending Payments</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.listCard}>
            <View style={styles.emptyState}>
              <Clock size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No pending farmer payments</Text>
              <Text style={styles.emptySubtext}>Payments will appear here when due</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Payments</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <CreditCard size={20} color={theme.colors.secondary} />
              <Text style={styles.infoTitle}>Daily & On-Demand</Text>
            </View>
            <Text style={styles.infoText}>
              Track customer payments based on their payment type. Daily customers pay at
              end of day, on-demand customers pay as required.
            </Text>
            <TouchableOpacity style={[styles.infoButton, { backgroundColor: theme.colors.secondary }]}>
              <Text style={styles.infoButtonText}>View Pending Payments</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.listCard}>
            <View style={styles.emptyState}>
              <CreditCard size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No pending customer payments</Text>
              <Text style={styles.emptySubtext}>Payments will appear here when due</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Settlements</Text>
          <Card style={styles.listCard}>
            <View style={styles.emptyState}>
              <CheckCircle size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No recent settlements</Text>
              <Text style={styles.emptySubtext}>Completed payments will appear here</Text>
            </View>
          </Card>
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
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  overviewGrid: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs,
  },
  overviewCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  overviewLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  overviewValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  infoCard: {
    marginBottom: theme.spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  infoButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  listCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
