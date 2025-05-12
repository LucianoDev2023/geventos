export const uploadImageToCloudinary = async (uri: string) => {
  const data = new FormData();

  data.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  data.append('upload_preset', 'wpfg2025app'); // público, configurado no Cloudinary
  data.append('cloud_name', 'djxmv3lkq');

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/djxmv3lkq/image/upload',
    {
      method: 'POST',
      body: data,
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error?.message || 'Erro ao enviar imagem');
  }

  return {
    uri: json.secure_url,
    publicId: json.public_id,
  };
};
