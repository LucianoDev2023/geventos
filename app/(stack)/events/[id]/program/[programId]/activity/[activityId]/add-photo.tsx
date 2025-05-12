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
import {
  ArrowLeft,
  Camera,
  Edit,
  Image as ImageIcon,
  Pencil,
  X,
} from 'lucide-react-native';
import Button from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '@/app/lib/uploadImageToCloudinary';

export default function AddActivityPhotoScreen() {
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
  const activity = program?.activities.find((a) => a.id === activityId);

  const handleTakePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permissão requerida',
          'Permissão quererida para utilização da câmera'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Falhou, tente novamente!');
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão necessária',
          'É necessário permitir o acesso à galeria para selecionar fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao escolher imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Por favor, selecine ou tire uma foto');
      return;
    }

    setIsSubmitting(true);

    try {
      const { uri, publicId } = await uploadImageToCloudinary(selectedImage);
      await addPhoto(id, programId, activityId, publicId, uri);

      Alert.alert(
        'Foto adicionada',
        'A foto foi adicionada com sucesso na atividade.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Falha ao add foto, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
  };

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Atividade não encontrada',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            The activity you're looking for doesn't exist or has been deleted.
          </Text>
          <Button
            title="Voltar"
            onPress={() => router.back()}
            style={styles.goBackButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Add Foto',
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
          Adicionar foto na atividade
        </Text>

        <Text style={[styles.activityTitle, { color: colors.primary }]}>
          {activity.title}
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
              <Edit size={20} color="white" />
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
              Nenhuma imagem selecionada
            </Text>

            <View style={styles.pickerButtonsContainer}>
              <Button
                title="Abrir câmera"
                onPress={handleTakePhoto}
                icon={<Camera size={18} color="white" />}
                style={styles.pickerButton}
              />

              <Button
                title="Escolher na galeria"
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
            title="Cancelar"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.cancelButton}
          />
          <Button
            title="Add foto"
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
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  activityTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
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
  pickerButtonsContainer: {
    width: '100%',
    gap: 16,
  },
  pickerButton: {
    width: '100%',
  },
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
  cancelButton: {
    flex: 0.48,
  },
  submitButton: {
    flex: 0.48,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 24,
  },
  goBackButton: {
    width: 120,
  },
});
