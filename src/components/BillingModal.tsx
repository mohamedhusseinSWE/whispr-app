"use client";

import { toast } from "sonner";
import { trpc } from "@/app/_trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, Crown, Check } from "lucide-react";
import { format } from "date-fns";

interface SubscriptionPlan {
  name?: string;
  slug?: string;
  quota?: number;
  pagesPerPdf?: number;
  price?: {
    amount: number;
    priceIds: {
      test: string;
      production: string;
    };
  };
  isSubscribed: boolean;
  isCanceled: boolean;
  stripeCurrentPeriodEnd: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
}

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionPlan: SubscriptionPlan;
}

const BillingModal = ({
  isOpen,
  onClose,
  subscriptionPlan,
}: BillingModalProps) => {
  const { mutate: createStripeSession, isPending } =
    trpc.createStripeSession.useMutation({
      onSuccess: ({ url }) => {
        if (url) {
          window.location.href = url;
        } else {
          toast.error("Please try again in a moment");
        }
      },
    });

  const handleUpgrade = () => {
    createStripeSession();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Upgrade to PRO
          </DialogTitle>
          <DialogDescription>
            Unlock unlimited features and enhance your PDF experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Plan Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Plan</CardTitle>
              <CardDescription>
                You are currently on the{" "}
                <strong>{subscriptionPlan.name || "Free"}</strong> plan.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* PRO Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                PRO Features
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Unlimited PDF uploads</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Advanced AI chat</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Unlimited quizzes & flashcards</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">High-quality podcast generation</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Priority support</span>
              </div>
            </div>
          </Card>

          {/* Subscription Info */}
          {subscriptionPlan.isSubscribed &&
            subscriptionPlan.stripeCurrentPeriodEnd && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <p className="text-xs text-gray-600">
                    {subscriptionPlan.isCanceled
                      ? "Your plan will be canceled on "
                      : "Your plan renews on "}
                    {format(
                      new Date(subscriptionPlan.stripeCurrentPeriodEnd),
                      "dd.MM.yyyy",
                    )}
                    .
                  </p>
                </CardFooter>
              </Card>
            )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleUpgrade}
            disabled={isPending}
            className="flex-1"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {subscriptionPlan.isSubscribed
              ? "Manage Subscription"
              : "Upgrade to PRO"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingModal;
