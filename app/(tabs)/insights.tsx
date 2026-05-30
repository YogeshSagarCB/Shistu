import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../db/client';

export default function InsightsScreen() {
  const [loading, setLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [insights, setInsights] = useState<{ observation: string; friction: string; advice: string } | null>(null);

  const checkApiKey = useCallback(async () => {
    try {
      const key = await SecureStore.getItemAsync('gemini_api_key');
      setApiKeyMissing(!key);
    } catch (e) {
      setApiKeyMissing(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkApiKey();
    }, [checkApiKey])
  );

  const generateInsights = async () => {
    setLoading(true);
    try {
      const apiKey = await SecureStore.getItemAsync('gemini_api_key');
      const storedModel = await SecureStore.getItemAsync('gemini_model') || 'gemini-1.5-flash';

      if (!apiKey) {
        Alert.alert('API Key Missing', 'Please set your Google AI Studio API key in settings.');
        setApiKeyMissing(true);
        setLoading(false);
        return;
      }

      // 1. Fetch 30 days of habit data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

      const habits = db.getAllSync<{ id: number; name: string; type: string; ai_granularity: string }>(`SELECT * FROM habits`);
      
      if (habits.length === 0) {
        Alert.alert('No Data', 'Create some habits and log some events before generating insights.');
        setLoading(false);
        return;
      }

      let promptData = "User Habit Data (Last 30 Days):\n";
      let hasEvents = false;
      
      for (const habit of habits) {
        if (habit.ai_granularity === 'raw') {
          const events = db.getAllSync<{ timestamp: string; value: number }>(
            `SELECT timestamp, numeric_value as value FROM events WHERE habit_id = ? AND timestamp >= ?`,
            habit.id, dateLimit
          );
          if (events.length > 0) hasEvents = true;
          promptData += `- Habit: ${habit.name} (${habit.type})\n  Logs: ${JSON.stringify(events)}\n`;
        } else {
          const stats = db.getAllSync<{ day: string; total: number }>(
            `SELECT date(timestamp) as day, SUM(numeric_value) as total FROM events WHERE habit_id = ? AND timestamp >= ? GROUP BY day`,
            habit.id, dateLimit
          );
          const notes = db.getAllSync<{ timestamp: string; notes: string }>(
            'SELECT timestamp, notes FROM events WHERE habit_id = ? AND timestamp >= ? AND notes IS NOT NULL AND notes != ""',
            habit.id, dateLimit
          );
          if (stats.length > 0) hasEvents = true;
          promptData += `- Habit: ${habit.name} (${habit.type})\n  Daily Totals: ${JSON.stringify(stats)}\n  Event Notes: ${JSON.stringify(notes)}\n`;
        }
      }

      if (!hasEvents) {
        Alert.alert('No Logs Found', 'You haven\'t logged any habits in the last 30 days. Log some data first!');
        setLoading(false);
        return;
      }

      // 2. Call Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const model = genAI.getGenerativeModel({ 
        model: storedModel,
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const systemPrompt = `
        Act as a behavioral analyst for a habit tracking app called Shistu.
        Analyze the user's local habit data and provide strategic, personalized insights.
        Use any "Event Notes" provided for qualitative context to better understand the user's behavior, struggles, or successes.
        
        The JSON response must have exactly these keys:
        {
          "observation": "A short sentence about a specific pattern (e.g. 'You track water more on weekends than weekdays.')",
          "friction": "A potential reason for a struggle or a success (e.g. 'Work-week stress might be causing you to forget water.')",
          "advice": "One actionable, scientifically-backed tip (e.g. 'Keep a water bottle on your desk during office hours.')"
        }
        
        Data:
        ${promptData}
      `;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        setInsights(JSON.parse(text));
      } catch (parseError) {
        console.error('Failed to parse JSON:', text);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setInsights(JSON.parse(jsonMatch[0]));
        } else {
          throw new Error("The AI returned an invalid response format.");
        }
      }

    } catch (error: any) {
      console.error('AI Error:', error);
      let errorMessage = "Failed to generate insights. Check your connection.";
      
      if (error.message?.includes("model")) {
        errorMessage = `The selected model is not available for this API key. Try selecting a different model in settings.`;
      }
      
      Alert.alert('AI Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {apiKeyMissing && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>⚠️ API Key Missing</Text>
            <Text style={styles.warningSubtext}>Add your Gemini API key in Settings to unlock AI features.</Text>
          </View>
        )}

        {!insights && !loading && (
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🧠</Text>
            <Text style={styles.heroTitle}>Behavioral Intelligence</Text>
            <Text style={styles.heroText}>
              Shistu uses Google AI to analyze your local patterns securely on-demand.
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4DA8DA" />
            <Text style={styles.loadingText}>Analyzing local data...</Text>
          </View>
        )}

        {insights && !loading && (
          <View style={styles.insightsList}>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>👀 Observation</Text>
              <Text style={styles.insightText}>{insights.observation}</Text>
            </View>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>🚧 Friction</Text>
              <Text style={styles.insightText}>{insights.friction}</Text>
            </View>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>💡 Advice</Text>
              <Text style={styles.insightText}>{insights.advice}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.generateButton, (loading || apiKeyMissing) && styles.disabledButton]} 
          onPress={generateInsights}
          disabled={loading || apiKeyMissing}
        >
          <Text style={styles.generateButtonText}>
            {insights ? 'Re-generate Insights' : 'Generate New Insights'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  warningCard: { backgroundColor: '#FF980022', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FF9800', marginBottom: 20 },
  warningText: { color: '#FF9800', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  warningSubtext: { color: '#FF9800CC', fontSize: 14 },
  hero: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  heroEmoji: { fontSize: 64, marginBottom: 20 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  heroText: { color: '#888', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  loadingContainer: { marginTop: 60, alignItems: 'center' },
  loadingText: { color: '#4DA8DA', marginTop: 20, fontSize: 16 },
  insightsList: { gap: 15, marginBottom: 30 },
  insightCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#4DA8DA' },
  insightLabel: { color: '#4DA8DA', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  insightText: { color: '#EEE', fontSize: 16, lineHeight: 22 },
  generateButton: { backgroundColor: '#4DA8DA', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  disabledButton: { opacity: 0.5 },
  generateButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
