import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Flower2,
  Plus,
  TrendingUp,
  Users,
  UserPlus,
  FileText,
  Bell,
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { FlowerType, DailySupply } from '@/types/database';

interface FlowerSummary {
  flower: FlowerType;
  todayQuantity: number;
}

export default function Dashboard() {
  const { retailer } = useAuth();
  const [flowerSummaries, setFlowerSummaries] = useState<FlowerSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (retailer) {
      loadFlowerSummaries();
    }
  }, [retailer]);

  const loadFlowerSummaries = async () => {
    if (!retailer) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: flowers } = await supabase
        .from('flower_types')
        .select('*')
        .eq('retailer_id', retailer.id)
        .eq('is_active', true);

      if (!flowers) return;

      const summaries = await Promise.all(
        flowers.map(async (flower) => {
          const { data: supplies } = await supabase
            .from('daily_supplies')
            .select('quantity')
            .eq('retailer_id', retailer.id)
            .eq('flower_type_id', flower.id)
            .eq('supply_date', today);

          const totalQuantity = supplies?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0;

          return {
            flower,
            todayQuantity: totalQuantity,
          };
        })
      );

      setFlowerSummaries(summaries);
    } catch (error) {
      console.error('Error loading flower summaries:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFlowerSummaries();
    setRefreshing(false);
  };

  const getFlowerIcon = (name: string) => {
    return <Flower2 size={32} color={theme.colors.primary} strokeWidth={1.5} />;
  };

  const quickActions = [
    { title: 'Add Farmer', icon: Users, color: theme.colors.primary },
    { title: 'Add Customer', icon: UserPlus, color: theme.colors.secondary },
    { title: 'Reports', icon: FileText, color: theme.colors.success },
    { title: 'Notifications', icon: Bell, color: theme.colors.warning },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.shopName}>{retailer?.shop_name}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color={theme.colors.textPrimary} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Flower Summary</Text>
          <View style={styles.flowerGrid}>
            {flowerSummaries.map((summary) => (
              <Card key={summary.flower.id} style={styles.flowerCard}>
                <View style={styles.flowerCardContent}>
                  {getFlowerIcon(summary.flower.name)}
                  <Text style={styles.flowerName}>{summary.flower.name}</Text>
                  <Text style={styles.flowerQuantity}>
                    {summary.todayQuantity.toFixed(2)} kg
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Price Update</Text>
            <TouchableOpacity>
              <TrendingUp size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <Card style={styles.priceCard}>
            <Text style={styles.priceCardTitle}>Update Today's Prices</Text>
            <Text style={styles.priceCardSubtitle}>
              Set morning, afternoon, and evening prices
            </Text>
            <TouchableOpacity style={styles.updateButton}>
              <Plus size={20} color="#fff" />
              <Text style={styles.updateButtonText}>Update Prices</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard}>
                <View
                  style={[styles.actionIconContainer, { backgroundColor: action.color + '20' }]}
                >
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.overviewGrid}>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Total Supply</Text>
              <Text style={styles.overviewValue}>
                {flowerSummaries
                  .reduce((sum, s) => sum + s.todayQuantity, 0)
                  .toFixed(2)} kg
              </Text>
            </Card>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Active Farmers</Text>
              <Text style={styles.overviewValue}>--</Text>
            </Card>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
  },
  greeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  shopName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  flowerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  flowerCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: theme.spacing.md,
  },
  flowerCardContent: {
    alignItems: 'center',
  },
  flowerName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  flowerQuantity: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
  },
  priceCard: {
    padding: theme.spacing.lg,
  },
  priceCardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  priceCardSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  actionCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  overviewGrid: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs,
  },
  overviewCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  overviewLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  overviewValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
