import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

/**
 * Phase-based progress indicator that groups 13 setup steps into 4 digestible phases.
 * This dramatically reduces cognitive load vs showing "Step 9 of 13".
 */

export interface Phase {
  id: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  steps: number[];
}

export const SETUP_PHASES: Phase[] = [
  { id: 1, title: 'Photos', icon: 'camera', steps: [1] },
  { id: 2, title: 'Background', icon: 'globe', steps: [2, 3, 4, 5, 6] },
  { id: 3, title: 'Personality', icon: 'sparkles', steps: [7, 8, 9] },
  { id: 4, title: 'Verification', icon: 'shield-checkmark', steps: [10, 11, 12, 13] },
];

const TOTAL_RAW_STEPS = 13;

interface StepProgressHeaderProps {
  currentStep: number;
  totalSteps?: number;
  title: string;
  onBack?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

const getPhaseForStep = (step: number): Phase => {
  return SETUP_PHASES.find(p => p.steps.includes(step)) || SETUP_PHASES[0];
};

const getPhaseProgress = (step: number): { currentPhase: number; inPhaseProgress: number; overallProgress: number } => {
  const phase = getPhaseForStep(step);
  const stepIndexInPhase = phase.steps.indexOf(step);
  const inPhaseProgress = (stepIndexInPhase + 1) / phase.steps.length;
  const overallProgress = step / TOTAL_RAW_STEPS;
  
  return {
    currentPhase: phase.id,
    inPhaseProgress,
    overallProgress,
  };
};

export default function StepProgressHeader({
  currentStep,
  title,
  onBack,
  onSkip,
  showSkip = true,
}: StepProgressHeaderProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentPhase = getPhaseForStep(currentStep);
  const { overallProgress } = getPhaseProgress(currentStep);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: overallProgress,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [currentStep, overallProgress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Phase indicators */}
      <View style={styles.phasesContainer}>
        {SETUP_PHASES.map((phase, index) => {
          const isActive = phase.id === currentPhase.id;
          const isComplete = phase.id < currentPhase.id;
          const isPending = phase.id > currentPhase.id;

          return (
            <View key={phase.id} style={styles.phaseItem}>
              <View
                style={[
                  styles.phaseDot,
                  isActive && styles.phaseDotActive,
                  isComplete && styles.phaseDotComplete,
                ]}
              >
                {isComplete ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Ionicons
                    name={phase.icon}
                    size={14}
                    color={isActive ? colors.white : 'rgba(255,255,255,0.4)'}
                  />
                )}
              </View>
              {index < SETUP_PHASES.length - 1 && (
                <View
                  style={[
                    styles.phaseConnector,
                    isComplete && styles.phaseConnectorComplete,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Phase label */}
      <View style={styles.labelRow}>
        <View style={styles.phaseLabel}>
          <Ionicons name={currentPhase.icon} size={16} color={colors.orange.primary} />
          <Text style={styles.phaseText}>{currentPhase.title}</Text>
        </View>
        <Text style={styles.progressPercent}>{Math.round(overallProgress * 100)}%</Text>
      </View>

      {/* Header with back, title, skip */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {showSkip && onSkip ? (
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  phasesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  phaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseDotActive: {
    backgroundColor: colors.orange.primary,
    borderColor: colors.orange.dark,
  },
  phaseDotComplete: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  phaseConnector: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: spacing.xs,
  },
  phaseConnectorComplete: {
    backgroundColor: colors.success,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.orange.primary,
    borderRadius: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  phaseLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  phaseText: {
    ...typography.label,
    color: colors.orange.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressPercent: {
    ...typography.small,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  skipButton: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '600',
  },
});
