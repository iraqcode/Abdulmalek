import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  difficulty: string;
  total_lessons: number;
}

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 
  (Platform.OS === 'web' ? '' : 'http://localhost:8001');

export default function HomeScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [progress, setProgress] = useState<any[]>([]);

  const categories = ['All', 'Network Security', 'Web Security', 'Ethical Hacking', 'Programming'];

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/api/progress/${userId}`);
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchCourses(), fetchProgress()]);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const filteredCourses = activeCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === activeCategory);

  const getCourseProgress = (courseId: string) => {
    const courseProgress = progress.find(p => p.course_id === courseId);
    if (!courseProgress) return 0;
    const course = courses.find(c => c.id === courseId);
    if (!course) return 0;
    return Math.round((courseProgress.completed_lessons?.length || 0) / course.total_lessons * 100);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'https://customer-assets.emergentagent.com/job_0fe61bb9-489d-480d-b866-06bdd4cbbbaf/artifacts/fjmaqzde_photo_5440527991625683214_y.jpg' }}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>
      <View style={styles.headerTextContainer}>
        <Text style={styles.appName}>Abdulmalek Majeed</Text>
        <Text style={styles.tagline}>Cybersecurity Academy</Text>
      </View>
    </View>
  );

  const renderWelcome = () => (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeTitle}>Welcome, Hacker!</Text>
      <Text style={styles.welcomeSubtitle}>
        Master cybersecurity, ethical hacking, and secure coding
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="book" size={24} color="#4A90D9" />
          <Text style={styles.statNumber}>{courses.length}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={24} color="#F39C12" />
          <Text style={styles.statNumber}>
            {progress.filter(p => getCourseProgress(p.course_id) === 100).length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={24} color="#E74C3C" />
          <Text style={styles.statNumber}>
            {progress.reduce((acc, p) => acc + (p.completed_lessons?.length || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
      </View>
    </View>
  );

  const renderCategories = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryChip,
            activeCategory === category && styles.categoryChipActive
          ]}
          onPress={() => setActiveCategory(category)}
        >
          <Text style={[
            styles.categoryText,
            activeCategory === category && styles.categoryTextActive
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCourseCard = (course: Course) => {
    const courseProgress = getCourseProgress(course.id);
    
    return (
      <TouchableOpacity
        key={course.id}
        style={[styles.courseCard, { borderLeftColor: course.color }]}
        onPress={() => router.push({
          pathname: '/course/[id]',
          params: { id: course.id, userId }
        })}
        activeOpacity={0.8}
      >
        <View style={[styles.courseIconContainer, { backgroundColor: course.color + '20' }]}>
          <Ionicons name={course.icon as any} size={28} color={course.color} />
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription} numberOfLines={2}>
            {course.description}
          </Text>
          <View style={styles.courseMeta}>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{course.difficulty}</Text>
            </View>
            <Text style={styles.lessonCount}>
              <Ionicons name="document-text" size={12} color="#8B949E" /> {course.total_lessons} Lessons
            </Text>
          </View>
          {courseProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${courseProgress}%`, backgroundColor: course.color }]} />
              </View>
              <Text style={styles.progressText}>{courseProgress}%</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={24} color="#8B949E" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90D9" />
        }
      >
        {renderHeader()}
        {renderWelcome()}
        
        <Text style={styles.sectionTitle}>Browse Courses</Text>
        {renderCategories()}
        
        <View style={styles.coursesContainer}>
          {filteredCourses.map(renderCourseCard)}
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
  loadingText: {
    color: '#8B949E',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4A90D9',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 14,
    color: '#4A90D9',
    fontWeight: '500',
  },
  welcomeSection: {
    backgroundColor: '#161B22',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#21262D',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  categoryChipActive: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  categoryText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  coursesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  courseCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
    borderLeftWidth: 4,
  },
  courseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 12,
  },
  difficultyText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '500',
  },
  lessonCount: {
    color: '#8B949E',
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#21262D',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '500',
    width: 35,
  },
});
