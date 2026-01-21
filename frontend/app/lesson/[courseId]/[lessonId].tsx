import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  duration_minutes: number;
  order: number;
}

interface Course {
  id: string;
  title: string;
  color: string;
  lessons: Lesson[];
}

const API_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 
  (Platform.OS === 'web' ? '' : 'http://localhost:8001');

export default function LessonScreen() {
  const router = useRouter();
  const { courseId, lessonId, userId } = useLocalSearchParams<{ 
    courseId: string; 
    lessonId: string;
    userId: string;
  }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchLesson();
  }, [courseId, lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}`);
      const courseData = await response.json();
      setCourse(courseData);
      
      const sortedLessons = courseData.lessons.sort((a: Lesson, b: Lesson) => a.order - b.order);
      const foundLesson = sortedLessons.find((l: Lesson) => l.id === lessonId);
      const index = sortedLessons.findIndex((l: Lesson) => l.id === lessonId);
      
      setLesson(foundLesson);
      setCurrentIndex(index);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    try {
      await fetch(`${API_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
        }),
      });
      setCompleted(true);
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  };

  const goToNextLesson = () => {
    if (course && currentIndex < course.lessons.length - 1) {
      const sortedLessons = course.lessons.sort((a, b) => a.order - b.order);
      const nextLesson = sortedLessons[currentIndex + 1];
      router.replace({
        pathname: '/lesson/[courseId]/[lessonId]',
        params: { courseId, lessonId: nextLesson.id, userId }
      });
    }
  };

  const goToPrevLesson = () => {
    if (course && currentIndex > 0) {
      const sortedLessons = course.lessons.sort((a, b) => a.order - b.order);
      const prevLesson = sortedLessons[currentIndex - 1];
      router.replace({
        pathname: '/lesson/[courseId]/[lessonId]',
        params: { courseId, lessonId: prevLesson.id, userId }
      });
    }
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <Text key={index} style={styles.contentHeader}>
            {line.replace(/\*\*/g, '')}
          </Text>
        );
      }
      
      // Code blocks
      if (line.startsWith('```')) {
        return null; // Skip the markers
      }
      
      // List items
      if (line.startsWith('- ')) {
        return (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{line.substring(2)}</Text>
          </View>
        );
      }
      
      // Numbered items
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.+)/);
        if (match) {
          return (
            <View key={index} style={styles.listItem}>
              <Text style={styles.numberBullet}>{match[1]}.</Text>
              <Text style={styles.listText}>{match[2]}</Text>
            </View>
          );
        }
      }
      
      // Code lines (simple detection)
      if (line.includes('import ') || line.includes('def ') || line.includes('nmap ') || 
          line.includes('#!/') || line.includes('grep ') || line.trim().startsWith('#') ||
          line.includes('SELECT ') || line.includes('sudo ')) {
        return (
          <View key={index} style={styles.codeBlock}>
            <Text style={styles.codeText}>{line}</Text>
          </View>
        );
      }
      
      // Regular paragraphs
      if (line.trim()) {
        return (
          <Text key={index} style={styles.paragraph}>
            {line.replace(/\*\*/g, '')}
          </Text>
        );
      }
      
      return <View key={index} style={{ height: 8 }} />;
    });
  };

  if (loading || !lesson || !course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      </SafeAreaView>
    );
  }

  const totalLessons = course.lessons.length;
  const hasNext = currentIndex < totalLessons - 1;
  const hasPrev = currentIndex > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.lessonIndicator}>Lesson {currentIndex + 1} of {totalLessons}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.lessonHeader}>
          <View style={[styles.lessonBadge, { backgroundColor: course.color + '20' }]}>
            <Ionicons name="book" size={20} color={course.color} />
          </View>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonDescription}>{lesson.description}</Text>
          <View style={styles.durationBadge}>
            <Ionicons name="time" size={14} color="#8B949E" />
            <Text style={styles.durationText}>{lesson.duration_minutes} min read</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {renderContent(lesson.content)}
        </View>

        {/* Complete Button */}
        <View style={styles.actionContainer}>
          {!completed ? (
            <TouchableOpacity style={styles.completeButton} onPress={markComplete}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Mark as Complete</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
              <Text style={styles.completedText}>Lesson Completed!</Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, !hasPrev && styles.navButtonDisabled]} 
            onPress={goToPrevLesson}
            disabled={!hasPrev}
          >
            <Ionicons name="chevron-back" size={20} color={hasPrev ? '#FFFFFF' : '#8B949E'} />
            <Text style={[styles.navButtonText, !hasPrev && styles.navButtonTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navButton, styles.navButtonPrimary, !hasNext && styles.navButtonDisabled]} 
            onPress={goToNextLesson}
            disabled={!hasNext}
          >
            <Text style={[styles.navButtonText, hasNext && styles.navButtonTextPrimary]}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color={hasNext ? '#FFFFFF' : '#8B949E'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  lessonIndicator: {
    color: '#8B949E',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  lessonHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  lessonBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lessonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 12,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  durationText: {
    color: '#8B949E',
    fontSize: 13,
  },
  contentContainer: {
    padding: 20,
  },
  contentHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#C9D1D9',
    lineHeight: 24,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    paddingLeft: 8,
    marginBottom: 8,
  },
  bullet: {
    color: '#4A90D9',
    fontSize: 16,
    marginRight: 8,
    width: 16,
  },
  numberBullet: {
    color: '#4A90D9',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
    width: 24,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#C9D1D9',
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: '#161B22',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90D9',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#79C0FF',
  },
  actionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC7120',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  completedText: {
    color: '#2ECC71',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#21262D',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 4,
  },
  navButtonPrimary: {
    backgroundColor: '#4A90D9',
  },
  navButtonDisabled: {
    backgroundColor: '#161B22',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#8B949E',
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
  },
});
