import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, useWindowDimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getTodayHabits, addEvent, HabitStats } from '../../db/helpers';
import { db } from '../../db/client';
import { Sparkline } from '../../components/Sparkline';

export default function TodayScreen() {
  const [habits, setHabits] = useState<HabitStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitStats | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showSparklines, setShowSparklines] = useState(true);
  
  const [sparklineData, setSparklineData] = useState<Record<number, number[]>>({});
  
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;

  const loadHabits = useCallback(async () => {
    const data = getTodayHabits();
    setHabits(data);
    
    const show = await SecureStore.getItemAsync('show_sparklines');
    setShowSparklines(show !== 'false');

    if (show !== 'false') {
      const newSparkData: Record<number, number[]> = {};
      
      for (const h of data) {
        const history = db.getAllSync<{ total: number }>(
          `SELECT SUM(numeric_value) as total FROM events WHERE habit_id = ? GROUP BY date(timestamp) ORDER BY date(timestamp) DESC LIMIT 7`,
          h.id
        );
        
        // Ensure we always return an array, defaulting to empty if no history
        newSparkData[h.id] = history.map(r => r.total).reverse();
      }
      
      setSparklineData(newSparkData);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHabits();
    setRefreshing(false);
  }, [loadHabits]);

  const handleOpenLogModal = (habit: HabitStats) => {
    setSelectedHabit(habit);
    setNoteText('');
    setNoteModalVisible(true);
  };

  const handleConfirmLog = () => {
    if (selectedHabit) {
      const value = selectedHabit.metric_type === 'binary' ? 1.0 : (selectedHabit.default_increment || 1.0);
      addEvent(selectedHabit.id, value, noteText);
      setNoteModalVisible(false);
      setSelectedHabit(null);
      loadHabits();
    }
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{dateString}</Text>
          <Text style={styles.subtitleText}>Shistu Local-First Tracker</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4DA8DA" />
        }
      >
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No habits yet. Tap + to start.</Text>
          </View>
        ) : (
          habits.map((habit) => (
            <View key={habit.id} style={[styles.card, { width: cardWidth }]}>
              <View style={styles.cardInfo}>
                <Text style={styles.habitName} numberOfLines={1}>{habit.icon_name} {habit.name}</Text>
                <Text style={[styles.habitStats, { color: habit.color_hex }]} numberOfLines={1}>
                  {habit.today_value} {habit.metric_unit || (habit.metric_type === 'binary' ? 'completed' : '')}
                </Text>
              </View>
              
              {showSparklines && sparklineData[habit.id] && sparklineData[habit.id].length > 1 && (
                <View style={styles.sparklineContainer}>
                  <Sparkline 
                    key={`${habit.id}-${sparklineData[habit.id].join(',')}`}
                    data={sparklineData[habit.id]} 
                    width={50} 
                    height={30} 
                    color={habit.color_hex} 
                    habitName={habit.name}
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: habit.color_hex + '33' }]} 
                onPress={() => handleOpenLogModal(habit)}
              >
                <Text style={[styles.addButtonText, { color: habit.color_hex }]}>+</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={noteModalVisible}
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log {selectedHabit?.name}</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add an optional note..."
              placeholderTextColor="#666"
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary} 
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary} 
                onPress={handleConfirmLog}
              >
                <Text style={styles.modalButtonTextPrimary}>Log Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/modals/add-habit')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  subtitleText: { color: '#888888', fontSize: 14, marginTop: 5 },
  feed: { flex: 1 },
  feedContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { marginTop: 100, alignItems: 'center' },
  emptyStateText: { color: '#888888', fontSize: 16 },
  card: { 
    backgroundColor: '#1E1E1E', 
    borderRadius: 16, 
    padding: 16, // Increased padding
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, // Increased margin
    overflow: 'hidden',
  },
  cardInfo: { flex: 1, minWidth: 0, marginRight: 15 },
  habitName: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' }, // Increased font size
  habitStats: { fontSize: 14, marginTop: 4, fontWeight: '500' }, // Increased font size
  sparklineContainer: { width: 60, height: 35, marginRight: 10, justifyContent: 'center', flexShrink: 0 },
  addButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, // Increased size
  addButtonText: { fontSize: 24, fontWeight: 'bold' }, // Increased size
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#4DA8DA', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  fabText: { color: '#FFFFFF', fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#000000', borderRadius: 20, padding: 25, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  noteInput: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 15, color: '#FFFFFF', fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalButtonPrimary: { flex: 1, backgroundColor: '#4DA8DA', padding: 15, borderRadius: 12, alignItems: 'center' },
  modalButtonSecondary: { flex: 1, backgroundColor: 'transparent', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalButtonTextPrimary: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalButtonTextSecondary: { color: '#888888', fontSize: 16, fontWeight: '600' },
});
