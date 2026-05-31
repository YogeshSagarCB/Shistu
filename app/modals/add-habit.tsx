import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { createHabit } from '../../db/helpers';

const COLORS = [
  '#4DA8DA', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF3B30', 
  '#FF9500', '#FFCC00', '#4CAF50', '#34C759', '#00BCD4', '#5AC8FA',
  '#9C27B0', '#E91E63', '#795548', '#607D8B', '#9E9E9E', '#FFFFFF'
];

const EMOJI_CATEGORIES = [
  { title: 'Popular', emojis: ['💧', '🏃', '🧘', '📖', '🍎', '💤', '💪', '🚭', '☕️', '💊', '🥗', '🚶', '🚴', '🏊', '🧠'] },
  { title: 'Activities', emojis: ['🧗', '⛳️', '🏸', '🏀', '⚽️', '🎸', '🎨', '🎬', '♟️', '🎮', '🎧', '🎤', '💻', '🛠️', '🧹'] },
  { title: 'Feelings', emojis: ['😊', '😌', '😤', '😴', '🥳', '😎', '🔥', '✨', '⚡️', '🌟', '🍀', '🎯', '📈', '✅', '❌'] },
];

export default function AddHabitScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState<'positive' | 'negative'>('positive');
  const [metricType, setMetricType] = useState<'binary' | 'numeric'>('binary');
  const [metricUnit, setMetricUnit] = useState('');
  const [defaultIncrement, setDefaultIncrement] = useState('1');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(EMOJI_CATEGORIES[0].emojis[0]);
  const [aiGranularity, setAiGranularity] = useState<'aggregated' | 'raw'>('aggregated');
  
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  
  const router = useRouter();

  const handleSave = () => {
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
      createHabit({
        name: name.trim(),
        type,
        metric_type: metricType,
        metric_unit: metricType === 'numeric' ? metricUnit : undefined,
        color_hex: selectedColor,
        icon_name: selectedIcon,
        ai_granularity: aiGranularity,
        default_increment: increment,
      });
      router.back();
    } catch (error) {
      console.error('Failed to create habit:', error);
      Alert.alert('Error', 'Failed to save habit to database.');
    }
  };

  const handleCustomEmojiChange = (text: string) => {
    if (text.length > 0) {
      const emoji = Array.from(text).pop() || '';
      setCustomEmoji(emoji);
      setSelectedIcon(emoji);
    } else {
      setCustomEmoji('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBuffer} />
      
      <View style={styles.header}>
        <View style={[styles.mainIconContainer, { backgroundColor: selectedColor + '22', borderColor: selectedColor }]}>
            <Text style={styles.mainIconText}>{selectedIcon}</Text>
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.label}>Habit Name</Text>
            <TextInput
                style={styles.nameInput}
                placeholder="e.g. Drink Water"
                placeholderTextColor="#555"
                value={name}
                onChangeText={setName}
            />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Behavior</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.smallToggle, type === 'positive' && { backgroundColor: '#34C75922', borderColor: '#34C759' }]}
              onPress={() => setType('positive')}
            >
              <Text style={[styles.toggleText, type === 'positive' && { color: '#34C759' }]}>Positive</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.smallToggle, type === 'negative' && { backgroundColor: '#FF3B3022', borderColor: '#FF3B30' }]}
              onPress={() => setType('negative')}
            >
              <Text style={[styles.toggleText, type === 'negative' && { color: '#FF3B30' }]}>Negative</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Logging Style</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.smallToggle, metricType === 'binary' && styles.activeToggle]}
              onPress={() => setMetricType('binary')}
            >
              <Text style={[styles.toggleText, metricType === 'binary' && styles.activeToggleText]}>Checkpoint</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.smallToggle, metricType === 'numeric' && styles.activeToggle]}
              onPress={() => setMetricType('numeric')}
            >
              <Text style={[styles.toggleText, metricType === 'numeric' && styles.activeToggleText]}>Numeric</Text>
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
            <Text style={styles.label}>Step Size</Text>
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

      <Text style={styles.label}>AI Analysis Mode</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={[styles.smallToggle, aiGranularity === 'aggregated' && styles.activeToggle]}
          onPress={() => setAiGranularity('aggregated')}
        >
          <Text style={[styles.toggleText, aiGranularity === 'aggregated' && styles.activeToggleText]}>Daily Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.smallToggle, aiGranularity === 'raw' && styles.activeToggle]}
          onPress={() => setAiGranularity('raw')}
        >
          <Text style={[styles.toggleText, aiGranularity === 'raw' && styles.activeToggleText]}>Raw Logs</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Icon Selection</Text>
      <View style={styles.iconSelectionArea}>
        <View style={styles.emojiGrid}>
            {EMOJI_CATEGORIES[0].emojis.map(emoji => (
                <TouchableOpacity 
                    key={emoji} 
                    style={[styles.emojiItem, selectedIcon === emoji && styles.activeEmojiItem]}
                    onPress={() => setSelectedIcon(emoji)}
                >
                    <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
            ))}
            <TouchableOpacity 
                style={[styles.emojiItem, styles.moreEmojiItem]} 
                onPress={() => setEmojiModalVisible(true)}
            >
                <Text style={styles.moreEmojiText}>...</Text>
            </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Theme Color</Text>
      <View style={styles.colorGrid}>
        {COLORS.map(color => (
          <TouchableOpacity 
            key={color} 
            style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.activeColorCircle]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
        <View style={styles.customColorContainer}>
            <TextInput
                style={styles.hexInput}
                value={selectedColor}
                onChangeText={setSelectedColor}
                placeholder="#HEX"
                placeholderTextColor="#555"
                autoCapitalize="characters"
                maxLength={7}
            />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Create Habit</Text>
      </TouchableOpacity>

      {/* Emoji Explorer Modal */}
      <Modal visible={emojiModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Emoji</Text>
                    <TouchableOpacity onPress={() => setEmojiModalVisible(false)}>
                        <Text style={styles.closeModalText}>Done</Text>
                    </TouchableOpacity>
                </View>
                
                <TextInput
                    style={styles.customEmojiInput}
                    placeholder="Type or paste any emoji..."
                    placeholderTextColor="#555"
                    value={customEmoji}
                    onChangeText={handleCustomEmojiChange}
                    autoFocus
                />

                <ScrollView>
                    {EMOJI_CATEGORIES.map(category => (
                        <View key={category.title} style={styles.categoryContainer}>
                            <Text style={styles.categoryTitle}>{category.title}</Text>
                            <View style={styles.categoryGrid}>
                                {category.emojis.map(emoji => (
                                    <TouchableOpacity 
                                        key={emoji} 
                                        style={styles.modalEmojiItem}
                                        onPress={() => {
                                            setSelectedIcon(emoji);
                                            setEmojiModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.emojiText}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  topBuffer: { height: 30 },
  content: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 10 },
  mainIconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  mainIconText: { fontSize: 40 },
  nameInput: { backgroundColor: '#1E1E1E', color: '#FFF', borderRadius: 12, padding: 15, fontSize: 18, fontWeight: '600' },
  label: { color: '#555', fontSize: 11, fontWeight: 'bold', marginTop: 25, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', borderRadius: 8, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 15, marginBottom: 5 },
  toggleRow: { flexDirection: 'row', gap: 10, width: '100%' },
  smallToggle: { flex: 1, backgroundColor: '#1E1E1E', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  activeToggle: { backgroundColor: '#4DA8DA22', borderColor: '#4DA8DA' },
  toggleText: { color: '#888', fontWeight: 'bold', fontSize: 14 },
  activeToggleText: { color: '#4DA8DA' },
  iconSelectionArea: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 15 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  emojiItem: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  activeEmojiItem: { backgroundColor: '#FFFFFF22', borderWidth: 1, borderColor: '#FFFFFF44' },
  emojiText: { fontSize: 24 },
  moreEmojiItem: { backgroundColor: '#333' },
  moreEmojiText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', padding: 10 },
  colorCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  activeColorCircle: { borderColor: '#FFF', transform: [{ scale: 1.2 }] },
  customColorContainer: { width: '100%', alignItems: 'center', marginTop: 10 },
  hexInput: { backgroundColor: '#1E1E1E', color: '#888', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, fontSize: 12, borderFocusColor: '#FFF' },
  saveButton: { backgroundColor: '#4DA8DA', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', height: '70%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  closeModalText: { color: '#4DA8DA', fontSize: 16, fontWeight: 'bold' },
  customEmojiInput: { backgroundColor: '#2A2A2A', color: '#FFF', borderRadius: 12, padding: 15, fontSize: 18, marginBottom: 20, textAlign: 'center' },
  categoryContainer: { marginBottom: 25 },
  categoryTitle: { color: '#555', fontSize: 12, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  modalEmojiItem: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
});
