"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Crown,
  MessageSquare,
  Headphones,
  Brain,
  CreditCard,
  FileAudio,
  Settings,
  LogOut,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MainSidebar from "@/components/layout/MainSidebar";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("settings");

  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const { data: subscriptionPlan } = trpc.getSubscriptionPlan.useQuery();
  const utils = trpc.useUtils();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      toast.success("Logged out successfully!");
      // Clear the user data from cache immediately
      utils.auth.me.setData(undefined, undefined);
      // Invalidate to refetch and ensure fresh state
      await utils.auth.me.invalidate();
      // Force a page refresh to ensure clean state
      window.location.href = "/login";
    },
    onError: () => {
      toast.error("Something went wrong. Try again.");
    },
  });

  const features = [
    {
      id: "chat-with-pdf",
      title: "Chat with PDF",
      description:
        "Ask questions about your document and get instant AI-powered responses",
      icon: MessageSquare,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      status: "Active",
    },
    {
      id: "listen-to-podcast",
      title: "Listen to Podcast",
      description:
        "Convert your documents into engaging audio podcasts with natural voice",
      icon: Headphones,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      status: "Active",
    },
    {
      id: "quiz",
      title: "Quiz",
      description:
        "Test your knowledge with AI-generated quizzes based on your documents",
      icon: Brain,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      status: "Active",
    },
    {
      id: "flashcards",
      title: "Flashcards",
      description:
        "Study efficiently with AI-generated flashcards from your content",
      icon: CreditCard,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      status: "Active",
    },
    {
      id: "transcript",
      title: "Transcript",
      description: "Get clean, formatted transcripts of your documents",
      icon: FileAudio,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      status: "Active",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <MainSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <div
        className={`flex-1 overflow-auto ${sidebarOpen ? "ml-64" : "ml-16"} transition-all duration-300`}
      >
        <Header
          title="Settings"
          subtitle="Manage your account and preferences"
        />

        <div className="p-6 max-w-7xl mx-auto">
          {/* User Profile Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your personal information and subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{user?.name}</h3>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      subscriptionPlan?.isSubscribed ? "default" : "secondary"
                    }
                  >
                    {subscriptionPlan?.isSubscribed ? (
                      <Crown className="w-3 h-3 mr-1" />
                    ) : null}
                    {subscriptionPlan?.isSubscribed ? "Pro Plan" : "Free Plan"}
                  </Badge>
                  {subscriptionPlan?.isSubscribed && (
                    <p className="text-xs text-gray-500 mt-1">
                      Renews{" "}
                      {subscriptionPlan?.stripeCurrentPeriodEnd
                        ? new Date(
                            subscriptionPlan.stripeCurrentPeriodEnd,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Available Features
              </CardTitle>
              <CardDescription>
                All the powerful features available in Whispr PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                        <feature.icon
                          className={`w-5 h-5 ${feature.iconColor}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">
                            {feature.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {feature.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Logout Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="font-medium text-red-900">Sign Out</h4>
                    <p className="text-sm text-red-700">
                      Sign out of your account
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  {logout.isPending ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
