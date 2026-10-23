import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
// Make sure you have initialized your Firebase app somewhere in your project!

/**
 * Universally uploads an image to Firebase Storage (Works on Web & Android)
 * @param uri The local URI from Expo Image Picker
 * @param folder The bucket folder (e.g., 'events' or 'stories')
 * @returns The public download URL
 */
export async function uploadImageToFirebase(
  uri: string,
  folder = "events",
): Promise<string> {
  // 1. Convert the local URI to a binary Blob (Universal approach)
  const response = await fetch(uri);
  const blob = await response.blob();

  // 2. Create a unique filename and storage reference
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const storageRef = ref(getStorage(), `${folder}/${filename}`);

  // 3. Upload the binary data directly to Firebase
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

  // 4. Return the public URL to store in MongoDB
  return await getDownloadURL(storageRef);
}
