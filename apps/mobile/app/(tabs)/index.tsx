import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore, MoodLevel } from '../../stores/userStore';
import { cancelTodayStreakWarning } from '../../lib/notifications';

const MOOD_OPTIONS: { level: MoodLevel; label: string; color: string }[] = [
  { level: 1, label: 'Struggling', color: '#e57373' },
  { level: 2, label: 'Low', color: '#ffb74d' },
  { level: 3, label: 'Okay', color: '#fff176' },
  { level: 4, label: 'Good', color: '#aed581' },
  { level: 5, label: 'Great', color: '#81c784' },
];

function MoodCheckIn() {
  const { todayMood, setTodayMood } = useUserStore();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(todayMood);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleMoodSelect = (mood: MoodLevel) => {
    setSelectedMood(mood);
    setTodayMood(mood);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2000);

    // Cancel today's streak warning notification
    cancelTodayStreakWarning();
  };

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f5ebe0' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontWeight: '600', color: '#2d3a2e', fontSize: 18 }}>
          How are you feeling?
        </Text>
        {showConfirmation && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={16} color="#5a9470" />
            <Text style={{ color: '#5a9470', marginLeft: 4, fontSize: 12 }}>Saved</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {MOOD_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.level}
            onPress={() => handleMoodSelect(option.level)}
            style={{
              alignItems: 'center',
              padding: 8,
              borderRadius: 12,
              backgroundColor: selectedMood === option.level ? `${option.color}30` : 'transparent',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: option.color,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: selectedMood === option.level ? 3 : 0,
                borderColor: '#2d3a2e',
              }}
            >
              <Text style={{ fontSize: 18 }}>
                {option.level === 1 ? '😔' : option.level === 2 ? '😕' : option.level === 3 ? '😐' : option.level === 4 ? '🙂' : '😊'}
              </Text>
            </View>
            <Text style={{ color: '#5a5347', fontSize: 11, marginTop: 4 }}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StreakCard() {
  const { currentStreak, longestStreak, getWeekMoods } = useUserStore();
  const weekMoods = getWeekMoods();

  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f5ebe0' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ fontWeight: '600', color: '#2d3a2e', fontSize: 18 }}>
            Your Streak
          </Text>
          <Text style={{ color: '#a69889', fontSize: 13, marginTop: 2 }}>
            {currentStreak > 0 ? `${currentStreak} day${currentStreak > 1 ? 's' : ''} and counting!` : 'Start your streak today'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#5a9470' }}>{currentStreak}</Text>
          <Text style={{ color: '#a69889', fontSize: 11 }}>days</Text>
        </View>
      </View>

      {/* Week visualization */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {last7Days.map((date, index) => {
          const moodEntry = weekMoods.find(m => m.date === date);
          const dayName = new Date(date).toLocaleDateString('en', { weekday: 'short' }).charAt(0);
          const isToday = date === new Date().toISOString().split('T')[0];

          return (
            <View key={date} style={{ alignItems: 'center' }}>
              <Text style={{ color: isToday ? '#5a9470' : '#a69889', fontSize: 11, fontWeight: isToday ? '600' : '400' }}>
                {dayName}
              </Text>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  marginTop: 6,
                  backgroundColor: moodEntry
                    ? MOOD_OPTIONS[moodEntry.mood - 1].color
                    : '#f5ebe0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isToday ? 2 : 0,
                  borderColor: '#5a9470',
                }}
              >
                {moodEntry && (
                  <Text style={{ fontSize: 14 }}>
                    {moodEntry.mood === 1 ? '😔' : moodEntry.mood === 2 ? '😕' : moodEntry.mood === 3 ? '😐' : moodEntry.mood === 4 ? '🙂' : '😊'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {longestStreak > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f5ebe0' }}>
          <Ionicons name="trophy-outline" size={16} color="#c97d52" />
          <Text style={{ color: '#a69889', marginLeft: 6, fontSize: 13 }}>
            Longest streak: <Text style={{ color: '#c97d52', fontWeight: '600' }}>{longestStreak} days</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

function QuickActions() {
  const router = useRouter();

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#5a9470', borderRadius: 12, paddingVertical: 16 }}
          onPress={() => router.push('/chat/new')}
        >
          <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
            Start Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#dcedde', borderRadius: 12, paddingVertical: 16 }}
          onPress={() => router.push('/voice-session')}
        >
          <Text style={{ color: '#3d654c', fontWeight: '600', textAlign: 'center' }}>
            Voice Session
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#f0f7f1', borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: '#dcedde' }}
          onPress={() => router.push('/flash-session')}
        >
          <Text style={{ color: '#4a7c5d', fontWeight: '600', textAlign: 'center' }}>
            Flash Session
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#fff8f0', borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: '#f5ebe0' }}
          onPress={() => router.push('/breathing')}
        >
          <Text style={{ color: '#c97d52', fontWeight: '600', textAlign: 'center' }}>
            Breathe
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#fff8f0', borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: '#f5ebe0' }}
          onPress={() => router.push('/crisis')}
        >
          <Text style={{ color: '#c97d52', fontWeight: '600', textAlign: 'center' }}>
            Get Help
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InsightsCard() {
  const { totalSessions, totalMessages, breathingSessionsCompleted } = useUserStore();

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f5ebe0' }}>
      <Text style={{ fontWeight: '600', color: '#2d3a2e', fontSize: 18, marginBottom: 12 }}>
        Your Journey
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#5a9470' }}>{totalSessions}</Text>
          <Text style={{ color: '#a69889', fontSize: 12 }}>Sessions</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#f5ebe0' }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#5a9470' }}>{totalMessages}</Text>
          <Text style={{ color: '#a69889', fontSize: 12 }}>Messages</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#f5ebe0' }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#5a9470' }}>{breathingSessionsCompleted}</Text>
          <Text style={{ color: '#a69889', fontSize: 12 }}>Breaths</Text>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { updateStreak } = useUserStore();

  useEffect(() => {
    // Update streak when dashboard loads
    updateStreak();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fefdfb' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: '#2d3a2e' }}>
            Welcome to Matcha
          </Text>
          <Text style={{ color: '#a69889', marginTop: 4 }}>
            Your companion for self-reflection
          </Text>
        </View>

        {/* Mood Check-in */}
        <MoodCheckIn />

        {/* Streak Card */}
        <StreakCard />

        {/* Quick Actions */}
        <QuickActions />

        {/* Journey Stats */}
        <InsightsCard />

        {/* Disclaimer */}
        <Text style={{
          color: '#c4b8ac',
          fontSize: 11,
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 24,
          paddingHorizontal: 16,
          lineHeight: 16,
        }}>
          Matcha is for self-reflection and entertainment only. Not a substitute for professional care.
        </Text>
      </ScrollView>
    </View>
  );
}
