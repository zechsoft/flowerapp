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
import { Search, Plus, User } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { Farmer } from '@/types/database';

export default function FarmersScreen() {
  const { retailer } = useAuth();
  const router = useRouter();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (retailer) {
      loadFarmers();
    }
  }, [retailer]);

  const loadFarmers = async () => {
    if (!retailer) return;

    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('retailer_id', retailer.id)
        .order('name');

      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error('Error loading farmers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFarmers();
    setRefreshing(false);
  };

  const filteredFarmers = farmers.filter((farmer) =>
    farmer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFarmerCard = ({ item }: { item: Farmer }) => (
    <Card style={styles.farmerCard} onPress={() => {}}>
      <View style={styles.farmerHeader}>
        <View style={styles.farmerAvatar}>
          <User size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.farmerInfo}>
          <Text style={styles.farmerName}>{item.name}</Text>
          <Text style={styles.farmerId}>ID: {item.farmer_code}</Text>
        </View>
      </View>
      <View style={styles.farmerStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Today's Supply</Text>
          <Text style={styles.statValue}>-- kg</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Outstanding</Text>
          <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
            ₹{item.outstanding_amount.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.farmerFooter}>
        <Text style={styles.lastPayment}>
          Last Payment: {item.last_payment_date || 'N/A'}
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Farmers</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search farmers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredFarmers}
        renderItem={renderFarmerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No farmers found</Text>
            <Text style={styles.emptySubtext}>Add your first farmer to get started</Text>
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
    backgroundColor: theme.colors.primary,
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
  farmerCard: {
    marginBottom: theme.spacing.md,
  },
  farmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  farmerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  farmerId: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  farmerStats: {
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
  farmerFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  lastPayment: {
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
