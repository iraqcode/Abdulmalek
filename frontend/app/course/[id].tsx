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

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  difficulty: string;
  total_lessons: number;
  lessons: Lesson[];
  quizzes: Quiz[];
}

interface Progress {
  completed_lessons: string[];
  quiz_scores: { [key: string]: number };
}

const API_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 
  (Platform.OS === 'web' ? '' : 'http://localhost:8001');

export default function CourseScreen() {
  const router = useRouter();
  const { id, userId } = useLocalSearchParams<{ id: string; userId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress>({ completed_lessons: [], quiz_scores: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes'>('lessons');

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        fetch(`${API_URL}/api/courses/${id}`),
        fetch(`${API_URL}/api/progress/${userId}/${id}`)
      ]);
      
      const courseData = await courseRes.json();
      const progressData = await progressRes.json();
      
      setCourse(courseData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.completed_lessons?.includes(lessonId) || false;
  };

  const getQuizScore = (quizId: string) => {
    return progress.quiz_scores?.[quizId];
  };

  const completedCount = progress.completed_lessons?.length || 0;
  const totalLessons = course?.lessons?.length || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (loading || !course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Course Header */}
        <View style={[styles.courseHeader, { borderColor: course.color }]}>
          <View style={[styles.iconCircle, { backgroundColor: course.color + '20' }]}>
            <Ionicons name={course.icon as any} size={40} color={course.color} />
          </View>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription}>{course.description}</Text>
          
          <View style={styles.metaRow}>
            <View style={[styles.metaBadge, { backgroundColor: course.color + '20' }]}>
              <Text style={[styles.metaText, { color: course.color }]}>{course.difficulty}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="time" size={14} color="#8B949E" />
              <Text style={styles.metaText}>
                {course.lessons.reduce((acc, l) => acc + l.duration_minutes, 0)} min
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="document-text" size={14} color="#8B949E" />
              <Text style={styles.metaText}>{totalLessons} Lessons</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{completedCount}/{totalLessons} completed</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: course.color }]} />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'lessons' && styles.tabActive]}
            onPress={() => setActiveTab('lessons')}
          >
            <Ionicons name="book" size={18} color={activeTab === 'lessons' ? '#4A90D9' : '#8B949E'} />
            <Text style={[styles.tabText, activeTab === 'lessons' && styles.tabTextActive]}>Lessons</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'quizzes' && styles.tabActive]}
            onPress={() => setActiveTab('quizzes')}
          >
            <Ionicons name="help-circle" size={18} color={activeTab === 'quizzes' ? '#4A90D9' : '#8B949E'} />
            <Text style={[styles.tabText, activeTab === 'quizzes' && styles.tabTextActive]}>Quizzes</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'lessons' ? (
            course.lessons
              .sort((a, b) => a.order - b.order)
              .map((lesson, index) => {
                const completed = isLessonCompleted(lesson.id);
                return (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[styles.lessonCard, completed && styles.lessonCardCompleted]}
                    onPress={() => router.push({
                      pathname: '/lesson/[courseId]/[lessonId]',
                      params: { courseId: course.id, lessonId: lesson.id, userId }
                    })}
                  >
                    <View style={[styles.lessonNumber, completed && { backgroundColor: '#2ECC71' }]}>
                      {completed ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.lessonNumberText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <Text style={styles.lessonDescription} numberOfLines={1}>
                        {lesson.description}
                      </Text>
                      <View style={styles.lessonMeta}>
                        <Ionicons name="time-outline" size={12} color="#8B949E" />
                        <Text style={styles.lessonDuration}>{lesson.duration_minutes} min</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8B949E" />
                  </TouchableOpacity>
                );
              })
          ) : (
            <>
              <TouchableOpacity
                style={styles.startQuizButton}
                onPress={() => router.push({
                  pathname: '/quiz/[courseId]',
                  params: { courseId: course.id, userId }
                })}
              >
                <View style={styles.quizIconContainer}>
                  <Ionicons name="trophy" size={32} color="#F39C12" />
                </View>
                <Text style={styles.startQuizTitle}>Take Course Quiz</Text>
                <Text style={styles.startQuizSubtitle}>
                  {course.quizzes.length} questions to test your knowledge
                </Text>
                <View style={styles.startQuizAction}>
                  <Text style={styles.startQuizText}>Start Quiz</Text>
                  <Ionicons name="arrow-forward" size={18} color="#4A90D9" />
                </View>
              </TouchableOpacity>

              {Object.keys(progress.quiz_scores || {}).length > 0 && (
                <View style={styles.quizHistorySection}>
                  <Text style={styles.quizHistoryTitle}>Quiz History</Text>
                  {Object.entries(progress.quiz_scores).map(([quizId, score]) => (
                    <View key={quizId} style={styles.quizScoreItem}>
                      <Ionicons 
                        name={score >= 70 ? "checkmark-circle" : "close-circle"} 
                        size={20} 
                        color={score >= 70 ? "#2ECC71" : "#E74C3C"} 
                      />
                      <Text style={styles.quizScoreText}>Score: {score}%</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  courseHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  metaText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    width: '100%',
    paddingHorizontal: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    color: '#8B949E',
    fontSize: 13,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#21262D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#161B22',
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  tabActive: {
    backgroundColor: '#4A90D920',
    borderColor: '#4A90D9',
  },
  tabText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#4A90D9',
  },
  contentContainer: {
    padding: 16,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  lessonCardCompleted: {
    borderColor: '#2ECC71',
    backgroundColor: '#2ECC7110',
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 13,
    color: '#8B949E',
    marginBottom: 6,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonDuration: {
    color: '#8B949E',
    fontSize: 12,
  },
  startQuizButton: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F39C1240',
  },
  quizIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F39C1220',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  startQuizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  startQuizSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  startQuizAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startQuizText: {
    color: '#4A90D9',
    fontSize: 14,
    fontWeight: '600',
  },
  quizHistorySection: {
    marginTop: 16,
  },
  quizHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  quizScoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  quizScoreText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
