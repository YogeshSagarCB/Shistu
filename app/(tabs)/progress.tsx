import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, { Line } from 'react-native-svg';
import { db } from '../../db/client';
import { Habit } from '../../db/helpers';
import { Sparkline } from '../../components/Sparkline';

const SCREEN_WIDTH = Dimensions.get('window').width;

const HabitSparkline = ({ habit, color }: { habit: Habit; color: string }) => {
  const [data, setData] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Fetch sparkline data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateLimit = ninetyDaysAgo.toISOString().split('T')[0];

    const results = db.getAllSync<{ day: string; total: number }>(`
      SELECT date(timestamp) as day, SUM(numeric_value) as total 
      FROM events WHERE habit_id = ? AND timestamp >= ? GROUP BY day`, 
      habit.id, dateLimit
    );

    const dataPoints = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const match = results.find(r => r.day === ds);
      dataPoints.push(match ? match.total : 0);
    }
    setData(dataPoints);

    // Fetch streak data
    const allEvents = db.getAllSync<{ day: string }>(`
        SELECT date(timestamp) as day FROM events WHERE habit_id = ? GROUP BY day ORDER BY day DESC
    `, habit.id);
    const activeDays = new Set(allEvents.map(r => r.day));

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let dateToTest = new Date(today);
    
    for (let i = 0; i < 365; i++) {
        const ds = dateToTest.toISOString().split('T')[0];
        const isActive = activeDays.has(ds);
        if (habit.type === 'positive' ? isActive : !isActive) {
            currentStreak++;
        } else {
            break;
        }
        dateToTest.setDate(dateToTest.getDate() - 1);
    }
    setStreak(currentStreak);
  }, [habit.id, habit.type]);

  if (data.length === 0) return null;

  return (
    <View style={styles.sparklineCardContent}>
        {/* Further reduced width to be absolutely safe against overflow */}
        <Sparkline 
        data={data} 
        width={SCREEN_WIDTH - 120} 
        height={80} 
        color={color} 
        habitName={habit.name}
        />
    </View>
  );
};

export default function ProgressScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);
  const [maxBarValue, setMaxBarValue] = useState(0);
  const [streak, setStreak] = useState(0);
  const [progressStyle, setProgressStyle] = useState<'heatmap' | 'sparkline' | 'bar'>('heatmap');

  const loadSettings = async () => {
    const style = await SecureStore.getItemAsync('progress_style');
    if (style && style !== 'chain') setProgressStyle(style as 'heatmap' | 'sparkline' | 'bar');
  };

  const loadHabits = useCallback(() => {
    const data = db.getAllSync<Habit>(`SELECT * FROM habits ORDER BY name ASC`);
    setHabits(data);
    if (data.length > 0 && !selectedHabitId) setSelectedHabitId(data[0].id);
  }, [selectedHabitId]);

  useFocusEffect(useCallback(() => { loadHabits(); loadSettings(); }, [loadHabits]));

  useEffect(() => {
    if (selectedHabitId) loadProgressData(selectedHabitId);
  }, [selectedHabitId]);

  const loadProgressData = (habitId: number) => {
    const habit = db.getFirstSync<Habit>(`SELECT * FROM habits WHERE id = ?`, habitId);
    if (!habit) return;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateLimit = ninetyDaysAgo.toISOString().split('T')[0];

    const results = db.getAllSync<{ day: string; total: number }>(`
      SELECT date(timestamp) as day, SUM(numeric_value) as total 
      FROM events WHERE habit_id = ? AND timestamp >= ? GROUP BY day`, 
      habitId, dateLimit
    );
    const activeDays = new Set(results.map(r => r.day));

    const data = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const match = results.find(r => r.day === ds);
      data.push({ date: ds, value: match ? match.total : 0 });
    }
    setChartData(data);
    
    const last30Days = data.slice(data.length - 30);
    setMaxBarValue(Math.max(...last30Days.map(d => d.value), 1));

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let dateToTest = new Date(today);
    
    for (let i = 0; i < 365; i++) {
        const ds = dateToTest.toISOString().split('T')[0];
        const isActive = activeDays.has(ds);
        if (habit.type === 'positive' ? isActive : !isActive) {
            currentStreak++;
        } else {
            break;
        }
        dateToTest.setDate(dateToTest.getDate() - 1);
    }
    setStreak(currentStreak);
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <View style={styles.container}>
      
      {(progressStyle === 'heatmap' || progressStyle === 'bar') && (
        <View style={styles.habitSelectorWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.habitSelectorContent}>
            {habits.map(h => (
              <TouchableOpacity key={h.id} style={[styles.habitChip, selectedHabitId === h.id && { backgroundColor: h.color_hex + '33', borderColor: h.color_hex }]} onPress={() => setSelectedHabitId(h.id)}>
                <Text style={[styles.habitChipText, selectedHabitId === h.id && { color: h.color_hex }]}>{h.icon_name} {h.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedHabit && (progressStyle === 'heatmap' || progressStyle === 'bar') ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statLabel}>{selectedHabit.type === 'positive' ? 'Current Streak' : 'Current Clean Streak'}</Text><Text style={[styles.statValue, { color: selectedHabit.color_hex }]}>{streak} Days</Text></View>
          </View>
          <Text style={styles.sectionTitle}>Last {progressStyle === 'heatmap' ? 90 : 30} Days</Text>
          {progressStyle === 'heatmap' ? (
            <View style={styles.heatmapGrid}>
              {chartData.map(item => (
                <View key={item.date} style={[styles.square, { backgroundColor: item.value > 0 ? selectedHabit.color_hex : '#333', opacity: item.value > 0 ? Math.min(0.2 + (item.value / 5) * 0.8, 1) : 1 }]} />
              ))}
            </View>
          ) : (
            <View style={styles.barChartContainer}>
                <View style={styles.yAxis}>
                    <Text style={styles.yAxisLabel}>{maxBarValue}</Text>
                    <Text style={styles.yAxisLabel}>{Math.round(maxBarValue / 2)}</Text>
                    <Text style={styles.yAxisLabel}>0</Text>
                </View>
                <View style={styles.chartArea}>
                  <Svg style={StyleSheet.absoluteFill}>
                    <Line x1="0" y1="0" x2="100%" y2="0" stroke="#444" strokeDasharray="3 3" />
                    <Line x1="0" y1="40" x2="100%" y2="40" stroke="#444" strokeDasharray="3 3" />
                    <Line x1="0" y1="80" x2="100%" y2="80" stroke="#444" strokeDasharray="3 3" />
                  </Svg>
                  {chartData.slice(chartData.length - 30).map(item => (
                    <View key={item.date} style={styles.barWrapper}>
                      {item.value > 0 && (
                        <View style={[styles.bar, { height: Math.max(5, (item.value / maxBarValue) * 80), backgroundColor: selectedHabit.color_hex }]} />
                      )}
                    </View>
                  ))}
                </View>
            </View>
          )}
        </ScrollView>
      ) : progressStyle === 'sparkline' ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.sparklineContentContainer}>
            {habits.map(h => {
              return (
                <View key={h.id} style={styles.listCard}>
                    <View style={styles.titleRow}>
                      <Text style={styles.listTitle}>{h.icon_name} {h.name}</Text>
                      <HabitStreak habitId={h.id} habitType={h.type} />
                    </View>
                    <HabitSparkline habit={h} color={h.color_hex} />
                </View>
              );
            })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const HabitStreak = ({ habitId, habitType }: { habitId: number, habitType: 'positive' | 'negative' }) => {
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const allEvents = db.getAllSync<{ day: string }>(`
            SELECT date(timestamp) as day FROM events WHERE habit_id = ? GROUP BY day ORDER BY day DESC
        `, habitId);
        const activeDays = new Set(allEvents.map(r => r.day));

        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        let dateToTest = new Date(today);
        
        for (let i = 0; i < 365; i++) {
            const ds = dateToTest.toISOString().split('T')[0];
            const isActive = activeDays.has(ds);
            if (habitType === 'positive' ? isActive : !isActive) {
                currentStreak++;
            } else {
                break;
            }
            dateToTest.setDate(dateToTest.getDate() - 1);
        }
        setStreak(currentStreak);
    }, [habitId, habitType]);

    return <Text style={styles.streakText}>{streak} days</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 40 },
  sparklineContentContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 40 },
  habitSelectorWrapper: { height: 60, marginBottom: 5, marginTop: 40 },
  habitSelectorContent: { paddingHorizontal: 20, alignItems: 'center' },
  habitChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1E1E1E', marginRight: 10, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  habitChipText: { color: '#888', fontWeight: '600', fontSize: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  statCard: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 16, flex: 1, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: '#888', fontSize: 14, marginBottom: 5 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 10, paddingHorizontal: 20 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignSelf: 'center', justifyContent: 'center', width: 320 }, 
  square: { width: 28, height: 28, borderRadius: 2 },
  barChartContainer: { flexDirection: 'row', height: 80, paddingHorizontal: 20, marginTop: 10 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', flex: 1, height: 80, gap: 4 },
  yAxis: { justifyContent: 'space-between', height: 80, paddingRight: 8 },
  yAxisLabel: { color: '#666', fontSize: 10 },
  barWrapper: { alignItems: 'center', flex: 1, height: 80, justifyContent: 'flex-end' },
  bar: { width: '80%', borderRadius: 2 },
  listCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, marginBottom: 15, marginHorizontal: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  streakText: { color: '#888', fontSize: 12 },
  sparklineCardContent: { width: '100%', alignItems: 'center' },
});
