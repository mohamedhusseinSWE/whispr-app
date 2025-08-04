import { TRPCError } from "@trpc/server";
import { privateProcedure, router } from "./trpc";
import { authRouter } from "./auth";
import { db } from "@/db";
import z from "zod";
import { INFINITE_QUERY_LIMIT } from "@/app/config/infinite-query";
import { PLANS } from "@/app/config/stripe";
import Stripe from "stripe";

import { getUserSubscriptionPlan } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-06-30.basil",

  typescript: true,
});

export const appRouter = router({
  auth: authRouter,

  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    //const userId = ctx.userId;
    const { userId } = ctx;

    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
    return await db.file.findMany({
      where: {
        userId: ctx.userId,
      },
    });
  }),

  // delete files for users //

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete all related records in the correct order
      try {
        // 1. Delete podcast sections first (they reference podcasts)
        await db.podcastSection.deleteMany({
          where: {
            podcast: {
              fileId: input.id,
            },
          },
        });

        // 2. Delete podcasts
        await db.podcast.deleteMany({
          where: {
            fileId: input.id,
          },
        });

        // 3. Delete quiz questions first (they reference quizzes)
        await db.quizQuestion.deleteMany({
          where: {
            quiz: {
              fileId: input.id,
            },
          },
        });

        // 4. Delete quizzes
        await db.quiz.deleteMany({
          where: {
            fileId: input.id,
          },
        });

        // 5. Delete flashcards
        await db.flashcard.deleteMany({
          where: {
            flashcards: {
              fileId: input.id,
            },
          },
        });

        // 6. Delete flashcards sets
        await db.flashcards.deleteMany({
          where: {
            fileId: input.id,
          },
        });

        // 7. Messages and Chunks will be deleted automatically due to onDelete: Cascade

        // 8. Finally delete the file
        await db.file.delete({
          where: {
            id: input.id,
          },
        });

        console.log(
          `✅ Successfully deleted file ${input.id} and all related records`,
        );
        return file;
      } catch (error) {
        console.error("❌ Error deleting file and related records:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file and related records",
        });
      }
    }),

  // lets get a single file //

  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      return file;
    }),

  // lets get fileMessages //

  getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;

      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: "desc",
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  getSubscriptionPlan: privateProcedure.query(async ({ ctx }) => {
    const plan = await getUserSubscriptionPlan(ctx.userId);

    return plan;
  }),

  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    const billingUrl = absoluteUrl("/dashboard/billing");

    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

    const subscriptionPlan = await getUserSubscriptionPlan(userId);

    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingUrl,
      });

      return { url: stripeSession.url };
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ["card", "paypal"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
    });

    return { url: stripeSession.url };
  }),

  // let get a status of the file we gonna upload it //
  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        },
      });

      if (!file) return { status: "PENDING" as const };

      return { status: file.uploadStatus };
    }),
});

export type AppRouter = typeof appRouter;
