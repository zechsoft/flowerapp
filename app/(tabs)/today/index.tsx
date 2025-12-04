import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { Farmer, Customer, FlowerType } from '@/types/database';

type EntryType = 'farmer' | 'customer';
type TimeSlot = 'morning' | 'afternoon' | 'evening';

export default function TodayEntryScreen() {
  const { retailer } = useAuth();
  const [entryType, setEntryType] = useState<EntryType>('farmer');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Farmer | Customer | null>(null);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [flowerTypes, setFlowerTypes] = useState<FlowerType[]>([]);
  const [selectedFlower, setSelectedFlower] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [sendNotification, setSendNotification] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (retailer) {
      loadData();
    }
  }, [retailer]);

  useEffect(() => {
    if (selectedFlower && timeSlot) {
      loadSuggestedPrice();
    }
  }, [selectedFlower, timeSlot, entryDate]);

  const loadData = async () => {
    if (!retailer) return;

    const [farmersData, customersData, flowersData] = await Promise.all([
      supabase.from('farmers').select('*').eq('retailer_id', retailer.id).order('name'),
      supabase.from('customers').select('*').eq('retailer_id', retailer.id).order('name'),
      supabase.from('flower_types').select('*').eq('retailer_id', retailer.id).eq('is_active', true),
    ]);

    if (farmersData.data) setFarmers(farmersData.data);
    if (customersData.data) setCustomers(customersData.data);
    if (flowersData.data) setFlowerTypes(flowersData.data);
  };

  const loadSuggestedPrice = async () => {
    if (!retailer || !selectedFlower) return;

    const { data } = await supabase
      .from('flower_prices')
      .select('*')
      .eq('retailer_id', retailer.id)
      .eq('flower_type_id', selectedFlower)
      .eq('price_date', entryDate)
      .maybeSingle();

    if (data) {
      const priceMap = {
        morning: data.morning_price,
        afternoon: data.afternoon_price,
        evening: data.evening_price,
      };
      setPrice(priceMap[timeSlot].toString());
    }
  };

  const getFilteredSuggestions = () => {
    const list = entryType === 'farmer' ? farmers : customers;
    if (!searchQuery || searchQuery.length < 2) return [];
    return list.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handlePersonSelect = (person: Farmer | Customer) => {
    setSelectedPerson(person);
    setSearchQuery(person.name);
    setShowSuggestions(false);
  };

  const handleSaveEntry = async () => {
    if (!retailer || !selectedPerson || !selectedFlower || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price || '0');

    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);

    try {
      if (entryType === 'farmer') {
        const { error } = await supabase.from('daily_supplies').insert({
          retailer_id: retailer.id,
          farmer_id: selectedPerson.id,
          flower_type_id: selectedFlower,
          quantity: quantityNum,
          supply_date: entryDate,
          notes,
          notification_sent: sendNotification,
        });

        if (error) throw error;

        if (sendNotification) {
          const flower = flowerTypes.find((f) => f.id === selectedFlower);
          await supabase.from('notifications').insert({
            retailer_id: retailer.id,
            recipient_type: 'farmer',
            recipient_id: selectedPerson.id,
            title: 'Supply Recorded',
            message: `Your supply of ${quantityNum}kg ${flower?.name} has been recorded for ${timeSlot}.`,
            is_read: false,
          });
        }
      } else {
        const totalAmount = quantityNum * priceNum;

        const { error } = await supabase.from('customer_purchases').insert({
          retailer_id: retailer.id,
          customer_id: selectedPerson.id,
          flower_type_id: selectedFlower,
          quantity: quantityNum,
          price_per_kg: priceNum,
          total_amount: totalAmount,
          purchase_date: entryDate,
          time_slot: timeSlot,
          payment_status: 'pending',
        });

        if (error) throw error;

        await supabase
          .from('customers')
          .update({
            pending_dues: ((selectedPerson as Customer).pending_dues || 0) + totalAmount,
            last_purchase_date: entryDate,
          })
          .eq('id', selectedPerson.id);

        if (sendNotification) {
          const flower = flowerTypes.find((f) => f.id === selectedFlower);
          await supabase.from('notifications').insert({
            retailer_id: retailer.id,
            recipient_type: 'customer',
            recipient_id: selectedPerson.id,
            title: 'Purchase Recorded',
            message: `Your order: ${quantityNum}kg ${flower?.name} at ₹${priceNum}/kg (Total: ₹${totalAmount.toFixed(2)})`,
            is_read: false,
          });
        }
      }

      Alert.alert('Success', 'Entry saved successfully!');
      clearForm();
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSearchQuery('');
    setSelectedPerson(null);
    setSelectedFlower('');
    setQuantity('');
    setPrice('');
    setNotes('');
    setShowSuggestions(false);
  };

  const suggestions = getFilteredSuggestions();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={24} color={theme.colors.primary} />
        <Text style={styles.title}>Today's Entry</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Entry Type</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                entryType === 'farmer' && styles.toggleButtonActive,
              ]}
              onPress={() => {
                setEntryType('farmer');
                clearForm();
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  entryType === 'farmer' && styles.toggleTextActive,
                ]}
              >
                Farmer (Supply IN)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                entryType === 'customer' && styles.toggleButtonActive,
              ]}
              onPress={() => {
                setEntryType('customer');
                clearForm();
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  entryType === 'customer' && styles.toggleTextActive,
                ]}
              >
                Customer (Sale OUT)
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>
            {entryType === 'farmer' ? 'Farmer Name' : 'Customer Name'}
          </Text>
          <Input
            placeholder="Type 2-3 letters to search..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(text.length >= 2);
              if (text.length < 2) setSelectedPerson(null);
            }}
            containerStyle={styles.inputContainer}
          />
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  style={styles.suggestionItem}
                  onPress={() => handlePersonSelect(person)}
                >
                  <Text style={styles.suggestionText}>{person.name}</Text>
                  <Text style={styles.suggestionSubtext}>
                    {entryType === 'farmer'
                      ? (person as Farmer).farmer_code
                      : (person as Customer).customer_code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Flower Type</Text>
          <View style={styles.flowerGrid}>
            {flowerTypes.map((flower) => (
              <TouchableOpacity
                key={flower.id}
                style={[
                  styles.flowerChip,
                  selectedFlower === flower.id && styles.flowerChipActive,
                ]}
                onPress={() => setSelectedFlower(flower.id)}
              >
                <Text
                  style={[
                    styles.flowerChipText,
                    selectedFlower === flower.id && styles.flowerChipTextActive,
                  ]}
                >
                  {flower.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Quantity (kg)</Text>
          <Input
            placeholder="Enter quantity in kg"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            containerStyle={styles.inputContainer}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Time Slot</Text>
          <View style={styles.timeSlotContainer}>
            {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.timeSlotButton,
                  timeSlot === slot && styles.timeSlotButtonActive,
                ]}
                onPress={() => setTimeSlot(slot)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    timeSlot === slot && styles.timeSlotTextActive,
                  ]}
                >
                  {slot.charAt(0).toUpperCase() + slot.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {entryType === 'customer' && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Price per kg (₹)</Text>
            <Input
              placeholder="Enter price or auto-filled"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              containerStyle={styles.inputContainer}
            />
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <Input
            placeholder="Any additional notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            containerStyle={styles.inputContainer}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.notificationRow}>
            <View>
              <Text style={styles.notificationTitle}>Send Notification</Text>
              <Text style={styles.notificationSubtitle}>
                {entryType === 'farmer'
                  ? 'WhatsApp/SMS to farmer'
                  : 'Bill to customer via WhatsApp/SMS'}
              </Text>
            </View>
            <Switch
              value={sendNotification}
              onValueChange={setSendNotification}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
              thumbColor={sendNotification ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
        </Card>

        <Button
          title="Save Entry"
          onPress={handleSaveEntry}
          loading={loading}
          style={styles.saveButton}
        />
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
    marginLeft: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 0,
  },
  suggestionsContainer: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  suggestionSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  flowerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  flowerChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    margin: theme.spacing.xs,
    backgroundColor: theme.colors.card,
  },
  flowerChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  flowerChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  flowerChipTextActive: {
    color: '#fff',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs,
  },
  timeSlotButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    margin: theme.spacing.xs,
    backgroundColor: theme.colors.card,
  },
  timeSlotButtonActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  timeSlotText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  timeSlotTextActive: {
    color: '#fff',
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  notificationSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
  },
});
