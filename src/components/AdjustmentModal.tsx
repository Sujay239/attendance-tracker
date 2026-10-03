import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface AdjustmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; inTime: string; outTime: string; reason: string; note: string }) => void;
  initialDate?: string;
}

const REASONS = [
  'Transit / Traffic Delay',
  'Client / Off-site Meeting',
  'Medical / Personal Appointment',
  'Hardware / Badge Technical Issue',
  'Forgotten Punch Clock',
];

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialDate = 'Oct 3, 2026',
}) => {
  const [inTime, setInTime] = useState('10:00 AM');
  const [outTime, setOutTime] = useState('07:00 PM');
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');

  const handleSave = () => {
    onSubmit({
      date: initialDate,
      inTime,
      outTime,
      reason: selectedReason,
      note,
    });
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.dragHandle} />

              <View style={styles.header}>
                <View>
                  <Text style={styles.sheetTitle}>Log Time Adjustment</Text>
                  <Text style={styles.sheetSubtitle}>
                    Correct punch times for {initialDate}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="close"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                {/* Time Input Fields */}
                <View style={styles.inputRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Clock In Time</Text>
                    <View style={styles.inputField}>
                      <MaterialIcons name="login" size={18} color={theme.colors.primary} />
                      <TextInput
                        value={inTime}
                        onChangeText={setInTime}
                        style={styles.textInput}
                        placeholder="09:00 AM"
                        placeholderTextColor={theme.colors.outline}
                      />
                    </View>
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Clock Out Time</Text>
                    <View style={styles.inputField}>
                      <MaterialIcons name="logout" size={18} color={theme.colors.secondaryBright} />
                      <TextInput
                        value={outTime}
                        onChangeText={setOutTime}
                        style={styles.textInput}
                        placeholder="05:00 PM"
                        placeholderTextColor={theme.colors.outline}
                      />
                    </View>
                  </View>
                </View>

                {/* Reason Code */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                  Reason Code
                </Text>
                <View style={styles.reasonsList}>
                  {REASONS.map((r) => {
                    const isSelected = selectedReason === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.reasonChip,
                          isSelected && styles.reasonChipSelected,
                        ]}
                        onPress={() => setSelectedReason(r)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                          size={16}
                          color={isSelected ? theme.colors.primary : theme.colors.outline}
                        />
                        <Text
                          style={[
                            styles.reasonChipText,
                            isSelected && styles.reasonChipTextSelected,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Optional Note */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                  Supervisor Note (Optional)
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  style={styles.noteInput}
                  placeholder="Explain reason for manual adjustment..."
                  placeholderTextColor={theme.colors.outline}
                  multiline
                  numberOfLines={2}
                />
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    Submit Adjustment for Approval
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  dragHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: theme.colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    marginBottom: theme.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(19, 27, 46, 0.08)',
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  reasonsList: {
    gap: 8,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 10,
  },
  reasonChipSelected: {
    backgroundColor: theme.colors.surfaceContainer,
    borderColor: theme.colors.primary,
  },
  reasonChipText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  reasonChipTextSelected: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  noteInput: {
    height: 64,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.onSurface,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(19, 27, 46, 0.08)',
  },
  actions: {
    marginTop: 4,
  },
  submitButton: {
    height: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
