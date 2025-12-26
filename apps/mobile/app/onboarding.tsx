import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, FlatList, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../stores/userStore';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Matcha',
    description: 'Your AI companion for self-discovery and personal growth. Explore your thoughts, reflect on emotions, and build mindful habits.',
    color: '#5a9470',
  },
  {
    id: '2',
    title: 'Talk Freely',
    description: 'Share what\'s on your mind in a judgment-free space. Our AI companion listens and helps you gain clarity through reflection.',
    color: '#6b9ac4',
  },
  {
    id: '3',
    title: 'Track Your Journey',
    description: 'Monitor your mood, build healthy streaks, and discover your emotional patterns over time.',
    color: '#c97d52',
  },
  {
    id: '4',
    title: 'Not a Replacement for Care',
    description: 'Matcha is for self-reflection and entertainment only. It does not provide medical advice, diagnosis, or treatment. Always consult a healthcare professional for mental health concerns.',
    color: '#a69889',
  },
];

interface Goal {
  id: string;
  label: string;
  description: string;
}

const GOALS: Goal[] = [
  { id: 'anxiety', label: 'Explore Worries', description: 'Reflect on anxious thoughts' },
  { id: 'mood', label: 'Mood Journaling', description: 'Track and understand feelings' },
  { id: 'stress', label: 'Stress Relief', description: 'Relaxation and breathing' },
  { id: 'sleep', label: 'Wind Down', description: 'Evening relaxation routines' },
  { id: 'relationships', label: 'Relationships', description: 'Reflect on connections' },
  { id: 'self-discovery', label: 'Know Myself', description: 'Explore thoughts and feelings' },
  { id: 'mindfulness', label: 'Mindfulness', description: 'Present moment awareness' },
  { id: 'growth', label: 'Personal Growth', description: 'Self-improvement reflections' },
];

function SlideItem({ item }: { item: OnboardingSlide }) {
  return (
    <View style={{ width, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: item.color,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        <Ionicons
          name={item.id === '1' ? 'leaf' : item.id === '2' ? 'chatbubbles' : item.id === '3' ? 'analytics' : 'information-circle'}
          size={56}
          color="white"
        />
      </View>
      <Text style={{
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 28,
        color: '#2d3a2e',
        textAlign: 'center',
        marginBottom: 16,
      }}>
        {item.title}
      </Text>
      <Text style={{
        fontSize: 16,
        color: '#5a5347',
        textAlign: 'center',
        lineHeight: 24,
      }}>
        {item.description}
      </Text>
    </View>
  );
}

function GoalsScreen({ onComplete }: { onComplete: (goals: string[]) => void }) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 28,
        color: '#2d3a2e',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        What brings you here?
      </Text>
      <Text style={{
        fontSize: 16,
        color: '#a69889',
        textAlign: 'center',
        marginBottom: 24,
      }}>
        Select all that apply
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {GOALS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              onPress={() => toggleGoal(goal.id)}
              style={{
                width: '47%',
                padding: 16,
                borderRadius: 12,
                backgroundColor: isSelected ? '#5a9470' : 'white',
                borderWidth: 1,
                borderColor: isSelected ? '#5a9470' : '#f5ebe0',
              }}
            >
              <Text style={{
                fontWeight: '600',
                color: isSelected ? 'white' : '#2d3a2e',
                marginBottom: 4,
              }}>
                {goal.label}
              </Text>
              <Text style={{
                fontSize: 12,
                color: isSelected ? 'rgba(255,255,255,0.8)' : '#a69889',
              }}>
                {goal.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        onPress={() => onComplete(selectedGoals)}
        disabled={selectedGoals.length === 0}
        style={{
          backgroundColor: selectedGoals.length > 0 ? '#5a9470' : '#e5ddd5',
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <Text style={{
          color: selectedGoals.length > 0 ? 'white' : '#a69889',
          fontWeight: '600',
          fontSize: 16,
        }}>
          {selectedGoals.length > 0 ? 'Continue' : 'Select at least one'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setGoals, setOnboardingComplete } = useUserStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGoals, setShowGoals] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowGoals(true);
    }
  };

  const handleSkip = () => {
    setShowGoals(true);
  };

  const handleGoalsComplete = (goals: string[]) => {
    setGoals(goals);
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  if (showGoals) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fefdfb' }}>
        <GoalsScreen onComplete={handleGoalsComplete} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fefdfb' }}>
      {/* Skip button */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 8 }}>
        <TouchableOpacity onPress={handleSkip} style={{ padding: 8 }}>
          <Text style={{ color: '#a69889', fontSize: 16 }}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => <SlideItem item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{ alignItems: 'center' }}
        style={{ flex: 1 }}
      />

      {/* Pagination dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={{
              width: currentIndex === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: currentIndex === index ? '#5a9470' : '#e5ddd5',
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>

      {/* Next button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: '#5a9470',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
