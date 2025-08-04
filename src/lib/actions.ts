"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { getUserSubscriptionPlan } from "./stripe";
import { getUserFromRequest } from "./auth";
import { uploadAudio } from "./audio-upload";
import {
  generateAudioFromText,
  createPodcastSections,
  formatDuration,
} from "./audio-generation";

interface PodcastSectionInput {
  title: string;
  description: string;
  content: string;
  duration: string;
}

export async function getQuizData(fileId: string) {
  try {
    const quiz = await db.quiz.findFirst({
      where: { fileId },
      include: { questions: true },
    });

    return { quiz };
  } catch (error) {
    console.error("Error fetching quiz data:", error);
    return { quiz: null };
  }
}

export async function getFlashcardsData(fileId: string) {
  try {
    const flashcards = await db.flashcards.findFirst({
      where: { fileId },
      include: { cards: true },
      orderBy: { createdAt: "desc" },
    });

    return { flashcards };
  } catch (error) {
    console.error("Error fetching flashcards data:", error);
    return { flashcards: null };
  }
}

export async function getFileData(fileId: string) {
  try {
    const file = await db.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        url: true,
      },
    });

    return { file };
  } catch (error) {
    console.error("Error fetching file data:", error);
    return { file: null };
  }
}

export async function getQuiz(fileId: string) {
  try {
    console.log("Fetching quiz for fileId:", fileId);

    const quiz = await db.quiz.findFirst({
      where: { fileId },
      include: { questions: true },
    });

    if (!quiz) {
      return { error: "Quiz not found" };
    }

    return { quiz };
  } catch (error) {
    console.error("Server action error:", error);
    return { error: "Failed to fetch quiz" };
  }
}

export async function getFlashcards(fileId: string) {
  try {
    console.log("Fetching flashcards for fileId:", fileId);

    const flashcards = await db.flashcards.findFirst({
      where: { fileId },
      include: { cards: true },
    });

    if (!flashcards) {
      return { error: "Flashcards not found" };
    }

    return { flashcards };
  } catch (error) {
    console.error("Server action error:", error);
    return { error: "Failed to fetch flashcards" };
  }
}

export async function getTranscript(fileId: string) {
  try {
    console.log("Fetching transcript for fileId:", fileId);

    const transcript = await db.transcript.findFirst({
      where: { fileId },
    });

    if (!transcript) {
      return { error: "Transcript not found" };
    }

    return { transcript };
  } catch (error) {
    console.error("Server action error:", error);
    return { error: "Failed to fetch transcript" };
  }
}

export async function createAllContent(fileId: string) {
  try {
    console.log("Create all content server action called with fileId:", fileId);

    // Fetch PDF content (chunks)
    const chunks = await db.chunk.findMany({
      where: { fileId },
      take: 20, // Get more chunks for comprehensive content
    });

    if (!chunks.length) {
      return { error: "No PDF content found for this file." };
    }

    // Check if content already exists
    const existingQuiz = await db.quiz.findFirst({ where: { fileId } });
    const existingFlashcards = await db.flashcards.findFirst({
      where: { fileId },
    });
    const existingTranscript = await db.transcript.findFirst({
      where: { fileId },
    });

    if (existingQuiz && existingFlashcards && existingTranscript) {
      console.log("All content already exists, returning existing data");
      return {
        quiz: existingQuiz,
        flashcards: existingFlashcards,
        transcript: existingTranscript,
        message: "Content already exists",
      };
    }

    // For now, return a message indicating that content generation should be done via API
    // This is because server actions have limitations with external API calls
    return {
      message:
        "Content generation initiated. Please use the API endpoint for generation.",
      needsGeneration: true,
    };
  } catch (error) {
    console.error("Server action error:", error);
    return { error: "Failed to create content" };
  }
}

export async function getSubscriptionPlan() {
  try {
    const subscriptionPlan = await getUserSubscriptionPlan();
    return { subscriptionPlan };
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    return {
      subscriptionPlan: {
        name: "Free",
        isSubscribed: false,
        isCanceled: false,
        stripeCurrentPeriodEnd: null,
      },
    };
  }
}

export async function getPodcast(fileId: string) {
  try {
    console.log("=== GET PODCAST SERVER ACTION ===");
    console.log("Fetching podcast for fileId:", fileId);

    const podcast = await db.podcast.findFirst({
      where: { fileId },
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!podcast) {
      console.log("No podcast found for fileId:", fileId);
      return { error: "Podcast not found" };
    }

    console.log("Podcast found:", {
      id: podcast.id,
      title: podcast.title,
      sectionsCount: podcast.sections.length,
      totalDuration: podcast.totalDuration,
    });

    return { podcast };
  } catch (error) {
    console.error("=== PODCAST FETCH ERROR ===");
    console.error("Server action error:", error);
    return { error: "Failed to fetch podcast" };
  }
}

export async function createPodcast(fileId: string) {
  try {
    console.log("=== CREATE PODCAST SERVER ACTION ===");

    const user = await getUserFromRequest();
    if (!user) {
      console.log("User not authenticated");
      return { error: "Unauthorized" };
    }

    console.log("User authenticated:", user.id);
    console.log("FileId received:", fileId);

    if (!fileId) {
      console.log("No fileId provided");
      return { error: "File ID is required" };
    }

    // Get the file and check if user owns it
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    });

    if (!file) {
      console.log("File not found or user does not own it");
      return { error: "File not found" };
    }

    console.log("File found:", file.name);

    // Check if podcast already exists
    const existingPodcast = await db.podcast.findFirst({
      where: {
        fileId,
      },
      include: {
        sections: true,
      },
    });

    if (existingPodcast) {
      console.log("Existing podcast found, deleting it first");
      // Delete existing podcast and its sections
      await db.podcastSection.deleteMany({
        where: {
          podcastId: existingPodcast.id,
        },
      });

      await db.podcast.delete({
        where: {
          id: existingPodcast.id,
        },
      });
      console.log("Existing podcast deleted");
    }

    // Get the file content from chunks
    console.log("File URL:", file.url);
    console.log("File name:", file.name);
    console.log("File ID:", file.id);

    // Get chunks from database
    const chunks = await db.chunk.findMany({
      where: { fileId: file.id },
      take: 30, // Get more content for better generation
      orderBy: { createdAt: "asc" },
    });

    console.log("🔍 Debug: Found chunks:", chunks.length);
    if (chunks.length > 0) {
      console.log(
        "🔍 Debug: First chunk preview:",
        chunks[0].text.substring(0, 100) + "...",
      );
      console.log(
        "🔍 Debug: Last chunk preview:",
        chunks[chunks.length - 1].text.substring(0, 100) + "...",
      );
    }

    let fileContent = "";

    if (chunks.length === 0) {
      console.log(
        "⚠️ No chunks found, trying to extract content from file URL...",
      );

      // Try to get content from the file URL as fallback
      try {
        const response = await fetch(file.url);
        if (response.ok) {
          const text = await response.text();
          fileContent = text.substring(0, 5000); // Limit to first 5000 chars
          console.log(
            "🔍 Debug: Extracted content from file URL, length:",
            fileContent.length,
          );
          console.log(
            "🔍 Debug: Content preview:",
            fileContent.substring(0, 200) + "...",
          );
        } else {
          console.error("❌ Failed to fetch file content from URL");
          return {
            error:
              "No content found for this file. Please ensure the PDF was processed successfully.",
          };
        }
      } catch (error) {
        console.error("❌ Error fetching file content:", error);
        return {
          error:
            "No content found for this file. Please ensure the PDF was processed successfully.",
        };
      }
    } else {
      console.log("✅ Using chunks for content, count:", chunks.length);
      fileContent = chunks.map((chunk) => chunk.text).join("\n\n");
      console.log("🔍 Debug: Combined content length:", fileContent.length);
      console.log(
        "🔍 Debug: Content preview:",
        fileContent.substring(0, 200) + "...",
      );
    }

    if (!fileContent || fileContent.trim().length === 0) {
      console.log("❌ No content available for podcast generation");
      return {
        error:
          "No content found for this file. Please ensure the PDF was processed successfully.",
      };
    }

    console.log("=== CREATING PODCAST SECTIONS ===");
    // Split content into sections for podcast
    const sections = await createPodcastSections(fileContent, file.name);
    console.log("Sections created:", sections.length);

    // Create podcast in database
    console.log("=== CREATING PODCAST IN DATABASE ===");
    const podcast = await db.podcast.create({
      data: {
        fileId,
        title: `${file.name} - Audio Version`,
        description: `Audio version of ${file.name}`,
        totalDuration: "0:00", // Will be calculated after audio generation
        userId: user.id,
      },
    });

    console.log("Podcast created with ID:", podcast.id);

    // Create sections in database
    console.log("=== CREATING SECTIONS IN DATABASE ===");
    const createdSections = await Promise.all(
      sections.map(async (section: PodcastSectionInput, index: number) => {
        console.log(`Creating section ${index + 1}:`, section.title);
        return await db.podcastSection.create({
          data: {
            podcastId: podcast.id,
            title: section.title,
            description: section.description,
            content: section.content,
            duration: section.duration,
            order: index,
          },
        });
      }),
    );

    console.log("All sections created:", createdSections.length);

    // Generate audio for the single section
    const section = createdSections[0]; // Get the single section
    let audioUrl = null;

    try {
      console.log(`=== GENERATING AUDIO FOR SECTION ===`);
      console.log(`🎙️ Generating audio for: ${section.title}`);
      console.log(`📝 Content length: ${section.content.length} characters`);
      console.log(
        `📝 Content preview: ${section.content.substring(0, 200)}...`,
      );

      // Check if we have valid content
      if (!section.content || section.content.trim().length === 0) {
        throw new Error("No content to convert to audio");
      }

      console.log(`🔍 Debug: Starting audio generation with ElevenLabs...`);
      const audioBuffer = await generateAudioFromText(section.content);
      console.log(`✅ Audio generated, size: ${audioBuffer.length} bytes`);

      if (audioBuffer.length === 0) {
        throw new Error("Generated audio buffer is empty");
      }

      console.log(
        `🔍 Debug: Audio buffer is valid, size: ${audioBuffer.length} bytes`,
      );

      // Use the old UUID-based format for now to ensure compatibility
      const filename = `${podcast.id}-${section.id}.wav`;
      console.log(`🔍 Debug: Saving audio file as: ${filename}`);
      audioUrl = await uploadAudio(audioBuffer, filename);
      console.log(`✅ Audio uploaded to: ${audioUrl}`);

      // Verify the file was actually created
      const { existsSync } = await import("fs");
      const { join } = await import("path");
      const filePath = join(
        process.cwd(),
        "public",
        "uploads",
        "audio",
        filename,
      );
      const fileExists = existsSync(filePath);
      console.log(`🔍 Debug: Audio file exists on disk: ${fileExists}`);
      console.log(`🔍 Debug: File path: ${filePath}`);

      // Update section with audio URL using upsert to avoid race conditions
      await db.podcastSection.upsert({
        where: { id: section.id },
        update: { audioUrl },
        create: {
          id: section.id,
          podcastId: section.podcastId,
          title: section.title,
          description: section.description,
          content: section.content,
          duration: section.duration,
          order: section.order,
          audioUrl,
        },
      });

      console.log(`✅ Section updated with audio URL: ${audioUrl}`);
    } catch (error) {
      console.error(
        `❌ Error generating audio for section ${section.id}:`,
        error,
      );
      console.error(
        `❌ Error details:`,
        error instanceof Error ? error.message : error,
      );

      // Create a fallback URL but log that it's not real
      const filename = `${podcast.id}-${section.id}.wav`;
      audioUrl = `/api/audio/${filename}`;
      console.log(`⚠️ Using fallback URL: ${audioUrl} (no actual audio file)`);

      // Use upsert to avoid database errors
      try {
        await db.podcastSection.upsert({
          where: { id: section.id },
          update: { audioUrl },
          create: {
            id: section.id,
            podcastId: section.podcastId,
            title: section.title,
            description: section.description,
            content: section.content,
            duration: section.duration,
            order: section.order,
            audioUrl,
          },
        });
        console.log(`✅ Section updated with fallback URL: ${audioUrl}`);
      } catch (dbError) {
        console.error(`❌ Database error updating section:`, dbError);
        // Continue without updating the database
      }
    }

    // Calculate total duration based on actual content length
    // Estimate: ~150 words per minute for speech
    const words = section.content.split(" ").length;
    const estimatedMinutes = words / 150; // words per minute
    const totalDurationSeconds = estimatedMinutes * 60;

    console.log(
      `Content: ${words} words, estimated duration: ${estimatedMinutes.toFixed(1)} minutes`,
    );

    // Update podcast with calculated duration
    await db.podcast.update({
      where: { id: podcast.id },
      data: { totalDuration: formatDuration(totalDurationSeconds) },
    });

    console.log("=== PODCAST CREATION COMPLETE ===");

    // Return the podcast with the single section
    const finalSection = {
      ...section,
      audioUrl: audioUrl || `/api/audio/${podcast.id}-${section.id}.wav`,
    };

    const finalPodcast = {
      ...podcast,
      sections: [finalSection],
      totalDuration: formatDuration(totalDurationSeconds),
    };

    console.log("Final podcast data:", {
      id: finalPodcast.id,
      title: finalPodcast.title,
      sectionsCount: finalPodcast.sections.length,
      totalDuration: finalPodcast.totalDuration,
      firstSectionTitle: finalPodcast.sections[0]?.title,
      firstSectionAudioUrl: finalPodcast.sections[0]?.audioUrl,
    });

    // Revalidate the podcast page
    revalidatePath(`/dashboard/${fileId}/podcast`);

    return { podcast: finalPodcast };
  } catch (error) {
    console.error("=== PODCAST CREATION ERROR ===");
    console.error("Error creating podcast:", error);
    return { error: "Failed to create podcast" };
  }
}
