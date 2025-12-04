import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  UserPlus,
  DollarSign,
  Calendar,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function ReportsScreen() {
  const { retailer } = useAuth();
  const router = useRouter();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [stats, setStats] = useState({
    totalSupply: 0,
    totalSales: 0,
    totalRevenue: 0,
    activeFarmers: 0,
    activeCustomers: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (retailer) {
      loadReportData();
    }
  }, [retailer, dateRange]);

  const loadReportData = async () => {
    if (!retailer) return;

    try {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      const [suppliesData, salesData, farmersData, customersData] = await Promise.all([
        supabase
          .from('daily_supplies')
          .select('quantity')
          .eq('retailer_id', retailer.id)
          .gte('supply_date', startDateStr)
          .lte('supply_date', today),
        supabase
          .from('customer_purchases')
          .select('total_amount, customer_id')
          .eq('retailer_id', retailer.id)
          .gte('purchase_date', startDateStr)
          .lte('purchase_date', today),
        supabase
          .from('farmers')
          .select('id, outstanding_amount')
          .eq('retailer_id', retailer.id),
        supabase
          .from('customers')
          .select('id, pending_dues')
          .eq('retailer_id', retailer.id),
      ]);

      const totalSupply = suppliesData.data?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0;
      const totalRevenue = salesData.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const uniqueCustomers = new Set(salesData.data?.map((s) => s.customer_id) || []).size;
      const pendingPayments = farmersData.data?.reduce((sum, f) => sum + Number(f.outstanding_amount), 0) || 0;

      setStats({
        totalSupply,
        totalSales: salesData.data?.length || 0,
        totalRevenue,
        activeFarmers: farmersData.data?.length || 0,
        activeCustomers: uniqueCustomers,
        pendingPayments,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    Alert.alert(
      'Export Report',
      `Export ${dateRange} report as ${format.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Success', `Report exported as ${format.toUpperCase()}`);
          },
        },
      ]
    );
  };

  const reportCards = [
    {
      title: 'Total Supply',
      value: `${stats.totalSupply.toFixed(2)} kg`,
      icon: TrendingUp,
      color: theme.colors.success,
      bgColor: theme.colors.success + '20',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      icon: FileText,
      color: theme.colors.primary,
      bgColor: theme.colors.primary + '20',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: theme.colors.success,
      bgColor: theme.colors.success + '20',
    },
    {
      title: 'Active Farmers',
      value: stats.activeFarmers.toString(),
      icon: Users,
      color: theme.colors.primary,
      bgColor: theme.colors.primary + '20',
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers.toString(),
      icon: UserPlus,
      color: theme.colors.secondary,
      bgColor: theme.colors.secondary + '20',
    },
    {
      title: 'Pending Payments',
      value: `₹${stats.pendingPayments.toFixed(2)}`,
      icon: DollarSign,
      color: theme.colors.error,
      bgColor: theme.colors.error + '20',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Reports & Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.dateRangeContainer}>
            {(['today', 'week', 'month', 'year'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.dateRangeButton,
                  dateRange === range && styles.dateRangeButtonActive,
                ]}
                onPress={() => setDateRange(range)}
              >
                <Text
                  style={[
                    styles.dateRangeText,
                    dateRange === range && styles.dateRangeTextActive,
                  ]}
                >
                  {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.cardsGrid}>
            {reportCards.map((card, index) => (
              <Card key={index} style={styles.reportCard}>
                <View style={[styles.iconContainer, { backgroundColor: card.bgColor }]}>
                  <card.icon size={24} color={card.color} />
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          <Card style={styles.exportCard}>
            <Text style={styles.exportTitle}>Download Report</Text>
            <Text style={styles.exportSubtitle}>
              Export your {dateRange} report in your preferred format
            </Text>
            <View style={styles.exportButtons}>
              <Button
                title="Export as PDF"
                onPress={() => handleExport('pdf')}
                variant="primary"
                style={styles.exportButton}
              />
              <Button
                title="Export as Excel"
                onPress={() => handleExport('excel')}
                variant="success"
                style={styles.exportButton}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Reports</Text>

          <Card style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>Flower Supply Analysis</Text>
                <Text style={styles.detailSubtitle}>Supply trends by flower type</Text>
              </View>
              <FileText size={24} color={theme.colors.primary} />
            </View>
          </Card>

          <Card style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>Sales Performance</Text>
                <Text style={styles.detailSubtitle}>Customer purchase patterns</Text>
              </View>
              <TrendingUp size={24} color={theme.colors.success} />
            </View>
          </Card>

          <Card style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>Payment Status</Text>
                <Text style={styles.detailSubtitle}>Outstanding and completed payments</Text>
              </View>
              <DollarSign size={24} color={theme.colors.secondary} />
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
  dateRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  dateRangeButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    margin: theme.spacing.xs,
    backgroundColor: theme.colors.card,
  },
  dateRangeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateRangeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  dateRangeTextActive: {
    color: '#fff',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  reportCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  exportCard: {
    padding: theme.spacing.lg,
  },
  exportTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  exportSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  exportButtons: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs,
  },
  exportButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  detailCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  detailSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
