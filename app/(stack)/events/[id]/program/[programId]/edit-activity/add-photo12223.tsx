import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useEvents } from '@/context/EventsContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { ArrowLeft, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export default function AddPhotoScreen() {
  const { id, programId, activityId } = useLocalSearchParams<{
    id: string;
    programId: string;
    activityId: string;
  }>();

  const { state, addPhoto } = useEvents();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const event = state.events.find((e) => e.id === id);
  const program = event?.programs.find((p) => p.id === programId);

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted || !mediaPermission.granted) {
      Alert.alert(
        'Permission Required',
        'You need to allow camera and media access.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = await MediaLibrary.createAssetAsync(result.assets[0].uri);
      setSelectedImage(asset.uri);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Access to media library is required.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select or take a photo first');
      return;
    }

    if (program && program.photos.length >= 3) {
      Alert.alert('Limit Reached', 'Maximum 3 photos allowed per day');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPhoto(id, programId, activityId, selectedImage);

      Alert.alert('Success', 'Photo added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Add Photo',
          headerTitleStyle: {
            fontFamily: 'Inter-Bold',
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.heading, { color: colors.text }]}>
          Add New Photo
        </Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          {program?.photos.length ?? 0}/3 photos added for this day
        </Text>

        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.error }]}
              onPress={handleClearImage}
            >
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.imagePickerContainer,
              { borderColor: colors.border },
            ]}
          >
            <Text style={[styles.pickerText, { color: colors.textSecondary }]}>
              No image selected
            </Text>
            <View style={styles.pickerButtonsContainer}>
              <Button
                title="Take Photo"
                onPress={handleTakePhoto}
                icon={<Camera size={18} color="white" />}
                style={styles.pickerButton}
              />
              <Button
                title="Choose from Library"
                onPress={handlePickImage}
                variant="secondary"
                icon={<ImageIcon size={18} color="white" />}
                style={styles.pickerButton}
              />
            </View>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.cancelButton}
          />
          <Button
            title="Add Photo"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedImage}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: { padding: 8 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, alignItems: 'center' },
  heading: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
    textAlign: 'center',
  },
  imagePickerContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
  },
  pickerText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 24,
  },
  pickerButtonsContainer: { width: '100%', gap: 16 },
  pickerButton: { width: '100%' },
  previewContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  cancelButton: { flex: 0.48 },
  submitButton: { flex: 0.48 },
});
