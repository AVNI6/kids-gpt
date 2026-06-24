"use client";

import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface DownloadCardProps {
  type: "pdf" | "docx";
  state: "idle" | "generating" | "uploading" | "downloading" | "success" | "error";
  onDownload: () => void;
}

export const DownloadCard = ({ type, state, onDownload }: DownloadCardProps) => {
  const isPdf = type === "pdf";

  // Theme styling configurations
  const themeClasses = isPdf
    ? {
        cardBg: "bg-sky-500/10 border-sky-500/20",
        iconContainer: "bg-sky-500/20 text-sky-600",
        spinner: "text-sky-600",
        buttonDisabled: "bg-sky-400 text-white cursor-not-allowed opacity-80",
        buttonActive: "bg-sky-500 hover:bg-sky-600 text-white hover:scale-[1.02] active:scale-95",
      }
    : {
        cardBg: "bg-blue-600/10 border-blue-600/20",
        iconContainer: "bg-blue-600/20 text-blue-600",
        spinner: "text-blue-600",
        buttonDisabled: "bg-blue-400 text-white cursor-not-allowed opacity-80",
        buttonActive: "bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] active:scale-95",
      };

  // Text strings based on state and type
  let title = "";
  let subtitle = "";
  let buttonLabel = "";

  switch (state) {
    case "generating":
      title = isPdf ? "Creating Educational PDF" : "Creating Word Document";
      subtitle = isPdf
        ? "Designing pages, wrapping text, formatting lists..."
        : "Writing paragraphs, generating tables, styling pages...";
      buttonLabel = "Generating...";
      break;
    case "uploading":
      title = "Saving to Cloud Library";
      subtitle = isPdf
        ? "Uploading the PDF to your student folder..."
        : "Uploading the document to your student folder...";
      buttonLabel = "Saving...";
      break;
    case "downloading":
      title = isPdf ? "Downloading material" : "Downloading document";
      subtitle = isPdf
        ? "Pushing the document to your local machine..."
        : "Pushing the document to your local machine...";
      buttonLabel = "Downloading...";
      break;
    case "success":
      title = "Successfully Downloaded!";
      subtitle = "Check your downloads folder! 🚀";
      buttonLabel = "Downloaded! ✓";
      break;
    case "error":
      title = "Generation Failed";
      subtitle = "Something went wrong. Let's try again.";
      buttonLabel = "Retry";
      break;
    default: // idle
      title = isPdf ? "Your PDF is ready" : "Your Word Document is ready";
      subtitle = isPdf
        ? "Click to download the formatted PDF"
        : "Click to download the formatted Word document";
      buttonLabel = isPdf ? "Download PDF" : "Download Word";
  }

  const isWorking = state && state !== "idle" && state !== "error";

  return (
    <div
      className={`mt-4 p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${themeClasses.cardBg}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${themeClasses.iconContainer}`}
        >
          {state === "success" ? (
            <span className="text-lg">🎉</span>
          ) : state === "error" ? (
            <span className="text-lg text-destructive">❌</span>
          ) : state && state !== "idle" ? (
            <Spinner className={`w-4.5 h-4.5 animate-spin ${themeClasses.spinner}`} />
          ) : (
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>
        <div>
          <p className="font-semibold text-foreground m-0">{title}</p>
          <p className="text-sm text-muted-foreground m-0">{subtitle}</p>
        </div>
      </div>
      <Button
        onClick={onDownload}
        disabled={isWorking}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all shrink-0 ${
          state === "success"
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : state === "error"
              ? "bg-destructive hover:bg-destructive/90 text-white"
              : isWorking
                ? themeClasses.buttonDisabled
                : themeClasses.buttonActive
        }`}
      >
        {buttonLabel}
      </Button>
    </div>
  );
};
