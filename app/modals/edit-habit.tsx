import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../db/client';
import { Habit, deleteHabit } from '../../db/helpers';

const COLORS = ['#4DA8DA', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
const ICONS = ['💧', '🏃', '🧘', '📖', '🍎', '💤', '💪', '🚭'];

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'positive' | 'negative'>('positive');
  const [metricType, setMetricType] = useState<'binary' | 'numeric'>('binary');
  const [metricUnit, setMetricUnit] = useState('');
  const [defaultIncrement, setDefaultIncrement] = useState('1');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [aiGranularity, setAiGranularity] = useState<'aggregated' | 'raw'>('aggregated');

  useEffect(() => {
    if (id) {
      const habit = db.getFirstSync<Habit>(`SELECT * FROM habits WHERE id = ?`, id);
      if (habit) {
        setName(habit.name);
        setType(habit.type);
        setMetricType(habit.metric_type);
        setMetricUnit(habit.metric_unit || '');
        setDefaultIncrement(habit.default_increment?.toString() || '1');
        setSelectedColor(habit.color_hex);
        setSelectedIcon(habit.icon_name);
        setAiGranularity(habit.ai_granularity);
      }
    }
  }, [id]);

  const handleUpdate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const increment = parseFloat(defaultIncrement);
    if (isNaN(increment) || increment <= 0) {
      Alert.alert('Error', 'Please enter a valid positive increment amount');
      return;
    }

    try {
      db.runSync(
        `UPDATE habits SET name=?, type=?, metric_type=?, metric_unit=?, color_hex=?, icon_name=?, ai_granularity=?, default_increment=? WHERE id=?`,
        name.trim(), type, metricType, metricType === 'numeric' ? metricUnit : null, selectedColor, selectedIcon, aiGranularity, increment, id
      );
      router.back();
    } catch (error) {
      console.error('Failed to update habit:', error);
      Alert.alert('Error', 'Failed to update habit.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      'Are you sure? This will delete all history for this habit.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteHabit(Number(id));
            router.back();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBuffer} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Edit Habit</Text>
      </View>

      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.smallToggle, type === 'positive' && styles.activeToggle]}
              onPress={() => setType('positive')}
            >
              <Text style={[styles.toggleText, type === 'positive' && styles.activeToggleText]}>Pos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.smallToggle, type === 'negative' && styles.activeToggle]}
              onPress={() => setType('negative')}
            >
              <Text style={[styles.toggleText, type === 'negative' && styles.activeToggleText]}>Neg</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Metric</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.smallToggle, metricType === 'binary' && styles.activeToggle]}
              onPress={() => setMetricType('binary')}
            >
              <Text style={[styles.toggleText, metricType === 'binary' && styles.activeToggleText]}>Check</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.smallToggle, metricType === 'numeric' && styles.activeToggle]}
              onPress={() => setMetricType('numeric')}
            >
              <Text style={[styles.toggleText, metricType === 'numeric' && styles.activeToggleText]}>Num</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {metricType === 'numeric' && (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. cups"
              placeholderTextColor="#555"
              value={metricUnit}
              onChangeText={setMetricUnit}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Log Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="1.0"
              placeholderTextColor="#555"
              value={defaultIncrement}
              onChangeText={setDefaultIncrement}
            />
          </View>
        </View>
      )}

      <Text style={styles.label}>AI Granularity</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={[styles.smallToggle, aiGranularity === 'aggregated' && styles.activeToggle]}
          onPress={() => setAiGranularity('aggregated')}
        >
          <Text style={[styles.toggleText, aiGranularity === 'aggregated' && styles.activeToggleText]}>Aggregated</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.smallToggle, aiGranularity === 'raw' && styles.activeToggle]}
          onPress={() => setAiGranularity('raw')}
        >
          <Text style={[styles.toggleText, aiGranularity === 'raw' && styles.activeToggleText]}>Raw Logs</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Icon & Color</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subLabel}>Quick Icons</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionRow}>
            {ICONS.map(icon => (
              <TouchableOpacity 
                key={icon} 
                style={[styles.iconBox, selectedIcon === icon && styles.activeBox]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={{ width: 80 }}>
          <Text style={styles.subLabel}>Custom</Text>
          <TextInput
            style={[styles.input, { textAlign: 'center', fontSize: 24, padding: 8, height: 50 }]}
            value={ICONS.includes(selectedIcon) ? '' : selectedIcon}
            onChangeText={(text) => {
              if (text.length > 0) {
                const emoji = Array.from(text).pop() || '';
                setSelectedIcon(emoji);
              }
            }}
            placeholder="😀"
            placeholderTextColor="#555"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subLabel}>Quick Colors</Text>
          <View style={styles.selectionRow}>
            {COLORS.map(color => (
              <TouchableOpacity 
                key={color} 
                style={[styles.colorBox, { backgroundColor: color }, selectedColor === color && styles.activeColorBox]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>
        <View style={{ width: 100 }}>
          <Text style={styles.subLabel}>Hex</Text>
          <TextInput
            style={[styles.input, { padding: 10, height: 40, fontSize: 14 }]}
            value={selectedColor}
            onChangeText={(text) => {
              setSelectedColor(text);
            }}
            placeholder="#HEX"
            placeholderTextColor="#555"
            autoCapitalize="characters"
            maxLength={7}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Habit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  topBuffer: { height: 30 },
  content: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 20 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  label: { color: '#888', fontSize: 12, fontWeight: 'bold', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  subLabel: { color: '#555', fontSize: 10, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', borderRadius: 8, padding: 15, fontSize: 16 },
  row: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  smallToggle: { flex: 1, backgroundColor: '#1E1E1E', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  activeToggle: { backgroundColor: '#4DA8DA33', borderColor: '#4DA8DA' },
  toggleText: { color: '#888', fontWeight: '600' },
  activeToggleText: { color: '#4DA8DA' },
  selectionRow: { flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap', gap: 10 },
  iconBox: { backgroundColor: '#1E1E1E', width: 50, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activeBox: { borderColor: '#4DA8DA', backgroundColor: '#4DA8DA33', borderWidth: 1 },
  iconText: { fontSize: 24 },
  colorBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  activeColorBox: { borderColor: '#FFF' },
  saveButton: { backgroundColor: '#4DA8DA', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  deleteButton: { padding: 18, alignItems: 'center', marginTop: 10 },
  deleteButtonText: { color: '#FF5252', fontSize: 16, fontWeight: '600' },
});
