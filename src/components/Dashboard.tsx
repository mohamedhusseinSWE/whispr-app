"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Headphones,
  Brain,
  CreditCard,
  FileAudio,
  Ghost,
  Loader2,
  Plus,
  Trash,
  Crown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import MainSidebar from "./layout/MainSidebar";
import Header from "./layout/Header";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { trpc } from "@/app/_trpc/client";
import UploadButton from "./UploadButton";
import Skeleton from "react-loading-skeleton";
import Link from "next/link";
import BillingModal from "./BillingModal";

const Dashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<
    string | null
  >(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  const utils = trpc.useContext();

  const { data: files, isLoading: filesLoading } = trpc.getUserFiles.useQuery();

  const { data: subscriptionPlan, isLoading: subLoading } =
    trpc.getSubscriptionPlan.useQuery();

  const isSubscribed = subscriptionPlan?.isSubscribed ?? false;
  const isFreePlan = !isSubscribed;
  const hasFiles = files && files.length > 0;
  const hasReachedFreeLimit = isFreePlan && hasFiles;

  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => utils.getUserFiles.invalidate(),
    onMutate({ id }) {
      setCurrentlyDeletingFile(id);
    },
    onSettled() {
      setCurrentlyDeletingFile(null);
    },
    onError: (error) => {
      console.error("Delete file error:", error);
      setCurrentlyDeletingFile(null);
    },
  });

  const quickActions = [
    {
      id: "chat-with-pdf",
      title: "Chat with PDF",
      description: "Ask questions about your document",
      icon: MessageSquare,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "listen-to-podcast",
      title: "Listen to Podcast",
      description: "Listen to your document as audio",
      icon: Headphones,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      id: "quiz",
      title: "Quiz",
      description: "Test your knowledge with quizzes",
      icon: Brain,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "flashcards",
      title: "Flashcards",
      description: "Study with AI-generated flashcards",
      icon: CreditCard,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      id: "transcript",
      title: "Transcript",
      description: "View document in text format",
      icon: FileAudio,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  const handleQuickAction = (action: { id: string }) => {
    if (!hasFiles) {
      alert("Please upload a PDF first to use this feature!");
      return;
    }

    // Get the most recent file
    const latestFile = files?.[0];
    if (!latestFile) {
      alert("No files available. Please upload a PDF first!");
      return;
    }

    switch (action.id) {
      case "chat-with-pdf":
        router.push(`/dashboard/${latestFile.id}?view=chatbot`);
        break;
      case "listen-to-podcast":
        router.push(`/dashboard/${latestFile.id}?view=podcast`);
        break;
      case "quiz":
        router.push(`/dashboard/${latestFile.id}/quiz`);
        break;
      case "flashcards":
        router.push(`/dashboard/${latestFile.id}/flashcards`);
        break;
      case "transcript":
        router.push(`/dashboard/${latestFile.id}/transcript`);
        break;
      default:
        console.log("Unknown action:", action.id);
    }
  };

  // Don't render if subscription plan is still loading
  if (subLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
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
        <Header title="Dashboard" subtitle="Create new notes" />

        <div className="p-6 max-w-7xl mx-auto">
          {activeView === "dashboard" && (
            <>
              {/* Features Section */}
              <div className="mb-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Quick Actions
                  </h2>
                  <p className="text-gray-600">
                    Choose what you&apos;d like to do with your documents
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {quickActions.map((action) => (
                    <div
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${action.bgColor}`}>
                          <action.icon
                            className={`w-5 h-5 ${action.iconColor}`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {action.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free Plan Limit Warning */}
              {hasReachedFreeLimit && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <h3 className="font-medium text-yellow-800">
                        You&apos;ve reached your free plan limit!
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Upgrade to PRO to upload unlimited PDFs and unlock all
                        features.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end my-4">
                <UploadButton
                  isSubscribed={isSubscribed}
                  disabled={hasReachedFreeLimit}
                />
              </div>

              {files && files.length !== 0 ? (
                <ul className="mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-3">
                  {files
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((file) => (
                      <li
                        key={file.id}
                        className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow transition hover:shadow-lg"
                      >
                        <Link
                          href={`/dashboard/${file.id}`}
                          className="flex flex-col gap-2"
                        >
                          <div className="pt-6 px-6 flex w-full items-center justify-between space-x-6">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                            <div className="flex-1 truncate">
                              <div className="flex items-center space-x-3">
                                <h3 className="truncate text-lg font-medium text-zinc-900">
                                  {file.name}
                                </h3>
                              </div>
                            </div>
                          </div>
                        </Link>

                        <div className="px-6 mt-4 grid grid-cols-3 place-items-center py-2 gap-6 text-xs text-zinc-500">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {format(new Date(file.createdAt), "MMM yyyy")}
                          </div>

                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            mocked
                          </div>

                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteFile({ id: file.id });
                            }}
                            size="sm"
                            className="w-full"
                            variant="destructive"
                          >
                            {currentlyDeletingFile === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : filesLoading ? (
                <Skeleton height={100} className="my-2" count={3} />
              ) : (
                <div className="mt-16 flex flex-col items-center gap-2">
                  <Ghost className="h-8 w-8 text-zinc-800" />
                  <h3 className="font-semibold text-xl">
                    Pretty empty around here
                  </h3>
                  <p>Let&apos;s upload your first PDF.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {subscriptionPlan && (
        <BillingModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          subscriptionPlan={subscriptionPlan}
        />
      )}
    </div>
  );
};

export default Dashboard;
