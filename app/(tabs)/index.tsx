import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import {
  Flower2,
  Plus,
  TrendingUp,
  Users,
  UserPlus,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { FlowerType } from '@/types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - theme.spacing.lg * 2;

interface FlowerSummary {
  flower: FlowerType;
  todayQuantity: number;
}

interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  colors: string[];
}

export default function Dashboard() {
  const { retailer } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [flowerSummaries, setFlowerSummaries] = useState<FlowerSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<FlowerType | null>(null);
  const [morningPrice, setMorningPrice] = useState('');
  const [afternoonPrice, setAfternoonPrice] = useState('');
  const [eveningPrice, setEveningPrice] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [activeFarmersCount, setActiveFarmersCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  const bannerSlides: BannerSlide[] = [
    {
      id: 1,
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your flower business efficiently',
      colors: ['#6C63FF', '#9D95FF'],
    },
    {
      id: 2,
      title: 'Update Today\'s Prices',
      subtitle: 'Keep your pricing current for better sales',
      colors: ['#FF6584', '#FF9CAB'],
    },
    {
      id: 3,
      title: 'Track Your Inventory',
      subtitle: `${flowerSummaries.reduce((sum, s) => sum + s.todayQuantity, 0).toFixed(2)} kg received today`,
      colors: ['#4CAF50', '#81C784'],
    },
  ];

  useEffect(() => {
    if (retailer) {
      loadDashboardData();
    }
  }, [retailer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [bannerSlides.length]);

  const loadDashboardData = async () => {
    if (!retailer) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const [flowersData, suppliesData, salesData] = await Promise.all([
        supabase
          .from('flower_types')
          .select('*')
          .eq('retailer_id', retailer.id)
          .eq('is_active', true),
        supabase
          .from('daily_supplies')
          .select('farmer_id, quantity, flower_type_id')
          .eq('retailer_id', retailer.id)
          .eq('supply_date', today),
        supabase
          .from('customer_purchases')
          .select('total_amount')
          .eq('retailer_id', retailer.id)
          .eq('purchase_date', today),
      ]);

      if (flowersData.data) {
        const summaries = await Promise.all(
          flowersData.data.map(async (flower) => {
            const flowerSupplies = suppliesData.data?.filter(
              (s) => s.flower_type_id === flower.id
            ) || [];
            const totalQuantity = flowerSupplies.reduce(
              (sum, s) => sum + Number(s.quantity),
              0
            );

            return {
              flower,
              todayQuantity: totalQuantity,
            };
          })
        );

        setFlowerSummaries(summaries);
      }

      const uniqueFarmers = new Set(suppliesData.data?.map((s) => s.farmer_id) || []);
      setActiveFarmersCount(uniqueFarmers.size);

      const todaySales = salesData.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      setTotalSales(todaySales);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handlePriceUpdate = (flower: FlowerType) => {
    setSelectedFlower(flower);
    loadCurrentPrices(flower.id);
    setShowPriceModal(true);
  };

  const loadCurrentPrices = async (flowerId: string) => {
    if (!retailer) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('flower_prices')
      .select('*')
      .eq('retailer_id', retailer.id)
      .eq('flower_type_id', flowerId)
      .eq('price_date', today)
      .maybeSingle();

    if (data) {
      setMorningPrice(data.morning_price.toString());
      setAfternoonPrice(data.afternoon_price.toString());
      setEveningPrice(data.evening_price.toString());
    } else {
      setMorningPrice('');
      setAfternoonPrice('');
      setEveningPrice('');
    }
  };

  const handleSavePrices = async () => {
    if (!retailer || !selectedFlower) return;

    if (!morningPrice || !afternoonPrice || !eveningPrice) {
      Alert.alert('Error', 'Please enter all prices');
      return;
    }

    const morning = parseFloat(morningPrice);
    const afternoon = parseFloat(afternoonPrice);
    const evening = parseFloat(eveningPrice);

    if (isNaN(morning) || isNaN(afternoon) || isNaN(evening)) {
      Alert.alert('Error', 'Please enter valid prices');
      return;
    }

    setPriceLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existing } = await supabase
        .from('flower_prices')
        .select('id')
        .eq('retailer_id', retailer.id)
        .eq('flower_type_id', selectedFlower.id)
        .eq('price_date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('flower_prices')
          .update({
            morning_price: morning,
            afternoon_price: afternoon,
            evening_price: evening,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('flower_prices').insert({
          retailer_id: retailer.id,
          flower_type_id: selectedFlower.id,
          price_date: today,
          morning_price: morning,
          afternoon_price: afternoon,
          evening_price: evening,
        });
      }

      await supabase.from('notifications').insert({
        retailer_id: retailer.id,
        recipient_type: 'system',
        title: 'Price Updated',
        message: `${selectedFlower.name} prices updated for ${today}`,
        is_read: false,
      });

      Alert.alert('Success', 'Prices updated successfully!');
      setShowPriceModal(false);
      await loadDashboardData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update prices');
    } finally {
      setPriceLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Farmer',
      icon: Users,
      color: theme.colors.primary,
      onPress: () => router.push('/(tabs)/farmers'),
    },
    {
      title: 'Add Customer',
      icon: UserPlus,
      color: theme.colors.secondary,
      onPress: () => router.push('/(tabs)/customers'),
    },
    {
      title: 'Reports',
      icon: FileText,
      color: theme.colors.success,
      onPress: () => router.push('/(tabs)/reports'),
    },
    {
      title: 'Notifications',
      icon: Bell,
      color: theme.colors.warning,
      onPress: () => router.push('/(tabs)/notifications'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.shopName}>{retailer?.shop_name}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Bell size={24} color={theme.colors.textPrimary} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.bannerSection}>
          <LinearGradient
            colors={bannerSlides[currentBannerIndex].colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <Text style={styles.bannerTitle}>{bannerSlides[currentBannerIndex].title}</Text>
            <Text style={styles.bannerSubtitle}>{bannerSlides[currentBannerIndex].subtitle}</Text>
            <View style={styles.bannerIndicators}>
              {bannerSlides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentBannerIndex === index && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Flower Summary</Text>
          <View style={styles.flowerGrid}>
            {flowerSummaries.map((summary) => (
              <Card key={summary.flower.id} style={styles.flowerCard}>
                <View style={styles.flowerCardContent}>
                  <Flower2 size={32} color={theme.colors.primary} strokeWidth={1.5} />
                  <Text style={styles.flowerName}>{summary.flower.name}</Text>
                  <Text style={styles.flowerQuantity}>
                    {summary.todayQuantity.toFixed(2)} kg
                  </Text>
                  <TouchableOpacity
                    style={styles.priceButton}
                    onPress={() => handlePriceUpdate(summary.flower)}
                  >
                    <TrendingUp size={16} color={theme.colors.primary} />
                    <Text style={styles.priceButtonText}>Update Price</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard} onPress={action.onPress}>
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: action.color + '20' },
                  ]}
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
                {flowerSummaries.reduce((sum, s) => sum + s.todayQuantity, 0).toFixed(2)} kg
              </Text>
            </Card>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Active Farmers</Text>
              <Text style={styles.overviewValue}>{activeFarmersCount}</Text>
            </Card>
          </View>
          <View style={[styles.overviewGrid, { marginTop: theme.spacing.md }]}>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Today's Sales</Text>
              <Text style={[styles.overviewValue, { color: theme.colors.success }]}>
                ₹{totalSales.toFixed(2)}
              </Text>
            </Card>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Pending Payments</Text>
              <Text style={[styles.overviewValue, { color: theme.colors.error }]}>--</Text>
            </Card>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showPriceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Prices - {selectedFlower?.name}</Text>
              <TouchableOpacity onPress={() => setShowPriceModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Morning Price (₹/kg)"
                placeholder="Enter morning price"
                value={morningPrice}
                onChangeText={setMorningPrice}
                keyboardType="decimal-pad"
              />
              <Input
                label="Afternoon Price (₹/kg)"
                placeholder="Enter afternoon price"
                value={afternoonPrice}
                onChangeText={setAfternoonPrice}
                keyboardType="decimal-pad"
              />
              <Input
                label="Evening Price (₹/kg)"
                placeholder="Enter evening price"
                value={eveningPrice}
                onChangeText={setEveningPrice}
                keyboardType="decimal-pad"
              />

              <Button
                title="Save Prices & Notify"
                onPress={handleSavePrices}
                loading={priceLoading}
                style={styles.savePriceButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  bannerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  banner: {
    height: 140,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  bannerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: '#fff',
    marginBottom: theme.spacing.xs,
  },
  bannerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: '#fff',
    opacity: 0.9,
  },
  bannerIndicators: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: theme.spacing.xs,
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
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
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary + '15',
  },
  priceButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  closeButton: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.textSecondary,
  },
  savePriceButton: {
    marginTop: theme.spacing.md,
  },
});
