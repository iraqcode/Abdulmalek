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
  color: string;
  quizzes: Quiz[];
}

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 
  (Platform.OS === 'web' ? '' : 'http://localhost:8001');

export default function QuizScreen() {
  const router = useRouter();
  const { courseId, userId } = useLocalSearchParams<{ courseId: string; userId: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [courseId]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}`);
      const data = await response.json();
      setCourse(data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    setAnswers([...answers, selectedAnswer]);
  };

  const handleNextQuestion = async () => {
    if (!course) return;
    
    if (currentQuestion < course.quizzes.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz complete
      setQuizComplete(true);
      
      // Calculate and save score
      const correctAnswers = answers.filter(
        (answer, index) => answer === course.quizzes[index].correct_answer
      ).length + (selectedAnswer === course.quizzes[currentQuestion].correct_answer ? 1 : 0);
      
      const score = Math.round((correctAnswers / course.quizzes.length) * 100);
      
      try {
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            course_id: courseId,
            quiz_id: course.id + '_quiz',
            score: score,
          }),
        });
      } catch (error) {
        console.error('Error saving quiz score:', error);
      }
    }
  };

  if (loading || !course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      </SafeAreaView>
    );
  }

  if (course.quizzes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="help-circle-outline" size={64} color="#8B949E" />
          <Text style={styles.emptyText}>No quizzes available for this course yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const quiz = course.quizzes[currentQuestion];
  const isCorrect = selectedAnswer === quiz.correct_answer;
  
  const calculateFinalScore = () => {
    const allAnswers = [...answers, selectedAnswer!];
    const correctCount = allAnswers.filter(
      (answer, index) => answer === course!.quizzes[index].correct_answer
    ).length;
    return Math.round((correctCount / course!.quizzes.length) * 100);
  };

  if (quizComplete) {
    const finalScore = calculateFinalScore();
    const passed = finalScore >= 70;
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.resultIcon, { backgroundColor: passed ? '#2ECC7120' : '#E74C3C20' }]}>
            <Ionicons 
              name={passed ? "trophy" : "reload"} 
              size={64} 
              color={passed ? "#2ECC71" : "#E74C3C"} 
            />
          </View>
          
          <Text style={styles.resultTitle}>
            {passed ? "Congratulations!" : "Keep Learning!"}
          </Text>
          
          <Text style={styles.resultSubtitle}>
            {passed 
              ? "You've passed the quiz!" 
              : "Review the lessons and try again"}
          </Text>
          
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={[styles.scoreValue, { color: passed ? '#2ECC71' : '#E74C3C' }]}>
              {finalScore}%
            </Text>
            <Text style={styles.scoreDetail}>
              {[...answers, selectedAnswer!].filter(
                (answer, index) => answer === course!.quizzes[index].correct_answer
              ).length} / {course!.quizzes.length} correct
            </Text>
          </View>
          
          <View style={styles.resultActions}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setCurrentQuestion(0);
                setSelectedAnswer(null);
                setShowResult(false);
                setAnswers([]);
                setQuizComplete(false);
              }}
            >
              <Ionicons name="refresh" size={20} color="#4A90D9" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              <Text style={styles.doneButtonText}>Back to Course</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            {currentQuestion + 1} / {course.quizzes.length}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.quizProgressBar}>
        <View 
          style={[
            styles.quizProgressFill, 
            { width: `${((currentQuestion + 1) / course.quizzes.length) * 100}%` }
          ]} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.quizContent}>
        <View style={styles.questionCard}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>Q{currentQuestion + 1}</Text>
          </View>
          <Text style={styles.questionText}>{quiz.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {quiz.options.map((option, index) => {
            let optionStyle = styles.optionButton;
            let textStyle = styles.optionText;
            let iconName: any = null;
            
            if (showResult) {
              if (index === quiz.correct_answer) {
                optionStyle = { ...styles.optionButton, ...styles.optionCorrect };
                textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
                iconName = "checkmark-circle";
              } else if (index === selectedAnswer && !isCorrect) {
                optionStyle = { ...styles.optionButton, ...styles.optionWrong };
                textStyle = { ...styles.optionText, ...styles.optionTextWrong };
                iconName = "close-circle";
              }
            } else if (index === selectedAnswer) {
              optionStyle = { ...styles.optionButton, ...styles.optionSelected };
            }
            
            return (
              <TouchableOpacity
                key={index}
                style={optionStyle}
                onPress={() => handleSelectAnswer(index)}
                disabled={showResult}
              >
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={textStyle}>{option}</Text>
                {iconName && (
                  <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={index === quiz.correct_answer ? '#2ECC71' : '#E74C3C'} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {showResult && (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Ionicons name="bulb" size={20} color="#F39C12" />
              <Text style={styles.explanationTitle}>Explanation</Text>
            </View>
            <Text style={styles.explanationText}>{quiz.explanation}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!showResult ? (
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              selectedAnswer === null && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitAnswer}
            disabled={selectedAnswer === null}
          >
            <Text style={styles.submitButtonText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
            <Text style={styles.nextButtonText}>
              {currentQuestion < course.quizzes.length - 1 ? 'Next Question' : 'See Results'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#8B949E',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  progressIndicator: {
    backgroundColor: '#21262D',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quizProgressBar: {
    height: 4,
    backgroundColor: '#21262D',
    marginHorizontal: 16,
    borderRadius: 2,
  },
  quizProgressFill: {
    height: '100%',
    backgroundColor: '#4A90D9',
    borderRadius: 2,
  },
  quizContent: {
    padding: 20,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  questionNumber: {
    backgroundColor: '#4A90D9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#30363D',
  },
  optionSelected: {
    borderColor: '#4A90D9',
    backgroundColor: '#4A90D920',
  },
  optionCorrect: {
    borderColor: '#2ECC71',
    backgroundColor: '#2ECC7120',
  },
  optionWrong: {
    borderColor: '#E74C3C',
    backgroundColor: '#E74C3C20',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#21262D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    color: '#C9D1D9',
    fontSize: 15,
    lineHeight: 22,
  },
  optionTextCorrect: {
    color: '#2ECC71',
  },
  optionTextWrong: {
    color: '#E74C3C',
  },
  explanationCard: {
    backgroundColor: '#F39C1210',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationTitle: {
    color: '#F39C12',
    fontSize: 14,
    fontWeight: '600',
  },
  explanationText: {
    color: '#C9D1D9',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#0D1117',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  submitButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#21262D',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#8B949E',
    marginBottom: 32,
  },
  scoreCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  scoreDetail: {
    fontSize: 14,
    color: '#8B949E',
    marginTop: 8,
  },
  resultActions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#21262D',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#4A90D9',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
