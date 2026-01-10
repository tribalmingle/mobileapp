import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, FlatList, Dimensions, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Find love within your tribe.',
    subtitle: 'Shared roots. Real love',
    description: 'Connect with people who share your culture for instant chemistry.',
    image: require('../../assets/hausa.webp'),
  },
  {
    id: '2',
    title: 'Guaranteed mature dating.',
    subtitle: 'For serious singles only',
    description: 'Verified members who are ready for meaningful commitment.',
    image: require('../../assets/igbo.webp'),
  },
  {
    id: '3',
    title: 'Real connections. Real intentions.',
    subtitle: 'Less swiping, more substance',
    description: 'Quality conversations with mature, serious members only.',
    image: require('../../assets/yoruba.webp'),
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleGetStarted = () => router.replace('/(auth)/signup');
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };
  const handleSkip = () => handleGetStarted();
  const isLastSlide = currentIndex === slides.length - 1;

  const renderSlide = ({ item }: { item: typeof slides[number] }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
      <View style={styles.slideTextContainer}>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
        return <Animated.View key={index} style={[styles.dot, { width: dotWidth, opacity, backgroundColor: colors.text.primary }]} />;
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A0A', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Image source={require('../../assets/logop.webp')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.tagline}>Connect with Your Roots</Text>
          </View>

          <View style={styles.sliderSection}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <FlatList
              ref={flatListRef}
              data={slides}
              renderItem={renderSlide}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              removeClippedSubviews={false}
              contentContainerStyle={{ paddingBottom: 20, alignItems: 'flex-start' }}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentIndex(index);
              }}
            />
          </View>

          {renderDots()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  gradient: { flex: 1 },
  content: { flex: 1, paddingTop: spacing.xxl, justifyContent: 'space-between', backgroundColor: 'transparent' },
  logoContainer: { flex: 0.6, justifyContent: 'center', alignItems: 'center', marginTop: Platform.OS === 'android' ? -spacing.xxl * 2 : -spacing.xl * 2, marginBottom: spacing.md },
  logoBadge: {
    width: 312,
    height: 70,
    borderRadius: 15,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoImage: { width: 230, height: 46 },
  tagline: { fontSize: 18, color: colors.text.primary },
  sliderSection: { flex: 1, marginTop: Platform.OS === 'android' ? -spacing.xxl * 2 : -spacing.xxl, marginBottom: spacing.md, overflow: 'visible' },
  slide: { width, paddingHorizontal: spacing.lg, alignItems: 'center', overflow: 'visible', backgroundColor: 'transparent' },
  slideImage: { width: width * 0.85, height: undefined, aspectRatio: 1.1, borderRadius: 24, marginBottom: spacing.sm, alignSelf: 'center' },
  slideTextContainer: { alignItems: 'center', paddingHorizontal: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xs, minHeight: 100, backgroundColor: 'transparent' },
  slideSubtitle: { ...typography.small, color: colors.text.primary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: spacing.xs },
  slideTitle: { ...typography.h2, fontSize: 30, textAlign: 'center', marginBottom: spacing.sm, color: colors.text.primary },
  slideDescription: { ...typography.body, textAlign: 'center', color: colors.text.primary },
  skipButton: { position: 'absolute', top: 0, right: spacing.lg, zIndex: 10, padding: spacing.sm },
  skipText: { ...typography.components.button, color: colors.text.primary },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
    marginTop: Platform.OS === 'android' ? -spacing.xl * 1.5 : -spacing.lg,
    marginBottom: Platform.OS === 'android' ? spacing.xs : -spacing.lg,
  },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  buttonContainer: { paddingHorizontal: spacing.lg, paddingBottom: Platform.OS === 'android' ? spacing.sm : spacing.xl, marginTop: Platform.OS === 'android' ? spacing.xs : spacing.xl },
  button: { marginBottom: spacing.md, backgroundColor: colors.primary, paddingVertical: spacing.md + 4, borderRadius: 50, alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
