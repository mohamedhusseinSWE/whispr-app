import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function uploadAudio(
  audioBuffer: Buffer,
  filename: string,
): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "audio");
    await mkdir(uploadsDir, { recursive: true });

    // Ensure filename has proper extension
    let finalFilename = filename;
    if (!filename.includes(".")) {
      finalFilename = filename + ".wav"; // Default to WAV for simple audio
    }

    // Save the audio file
    const filePath = join(uploadsDir, finalFilename);
    await writeFile(filePath, audioBuffer);

    console.log(`Audio file saved to: ${filePath}`);
    console.log(`File size: ${audioBuffer.length} bytes`);

    // Return the API route URL
    const publicUrl = `/api/audio/${finalFilename}`;
    console.log(`Public URL: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
}
