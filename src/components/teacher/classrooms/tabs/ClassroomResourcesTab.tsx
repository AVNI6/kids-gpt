"use client";

import { useState } from "react";
import {
  PlusCircle,
  FolderOpen,
  FileText,
  ExternalLink,
  Trash2,
  Upload,
  Loader2,
  Link as LinkSymbol,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadResource } from "@/lib/services/kid/classroom.actions";
import { uploadChatAttachment } from "@/lib/storage/attachments";
import { createClient } from "@/lib/supabase/client";
import type { ClassroomResource } from "@/types/classroom.types";
import { getSignedResourceUrl } from "@/lib/services/shared/storage.actions";
import { getResourceDisplay } from "@/hooks/useResourceDisplay";

type Props = {
  classroomId: string;
  resources: ClassroomResource[];
  setResources: React.Dispatch<React.SetStateAction<ClassroomResource[]>>;
  handleDeleteResource: (id: string) => void;
};

export default function ClassroomResourcesTab({
  classroomId,
  resources,
  setResources,
  handleDeleteResource,
}: Props) {
  const [resourceOpen, setResourceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Upload Method selection: "FILE" or "LINK"
  const [uploadMethod, setUploadMethod] = useState<"FILE" | "LINK">("FILE");

  // Upload Resource inputs
  const [resTitle, setResTitle] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [resType, setResType] = useState<string>("PDF");
  const [resUrl, setResUrl] = useState("");
  const [resStoragePath, setResStoragePath] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingFile(true);
      const supabase = createClient();

      // Get user session to identify folders
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || "anonymous";

      const fileExtension = file.name.split(".").pop() || "";
      const cleanedFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const path = `${userId}/classroom/${classroomId}/${cleanedFileName}`;

      const uploadResult = await uploadChatAttachment(supabase, userId, file, path);

      if (uploadResult.success && uploadResult.publicUrl) {
        setResUrl(uploadResult.publicUrl);
        setResStoragePath(uploadResult.path || "");

        // Auto select type based on extension
        const ext = fileExtension.toUpperCase();
        if (ext === "PDF") {
          setResType("PDF");
        } else if (["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"].includes(ext)) {
          setResType("IMAGE");
        } else if (["DOC", "DOCX"].includes(ext)) {
          setResType("WORD");
        } else {
          setResType("DOCUMENT");
        }

        // Auto fill title if empty
        if (!resTitle.trim()) {
          setResTitle(file.name.substring(0, file.name.lastIndexOf(".")) || file.name);
        }

        toast.success("File uploaded to storage successfully!");
      } else {
        toast.error(uploadResult.error || "Failed to upload file.");
      }
    } catch {
      toast.error("Failed to upload file to storage.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) {
      toast.error("Please provide both a title and a file or URL link.");
      return;
    }

    try {
      setIsLoading(true);
      // Map extended types down to one of the DB allowed types: "PDF" | "VIDEO" | "LINK" | "DOCUMENT"
      let apiType: "PDF" | "VIDEO" | "LINK" | "DOCUMENT" = "DOCUMENT";
      if (resType === "PDF") apiType = "PDF";
      else if (resType === "VIDEO") apiType = "VIDEO";
      else if (resType === "LINK") apiType = "LINK";

      const result = await uploadResource(
        classroomId,
        resTitle,
        resDesc,
        apiType,
        resUrl,
        resStoragePath || null
      );

      if (result.success && result.resource) {
        toast.success("Resource saved to classroom!");

        // Keep the user selected type in local state resource object for visualization
        const enrichedResource = {
          ...result.resource,
          resource_type: resType as "PDF" | "VIDEO" | "LINK" | "DOCUMENT",
        };

        setResources([enrichedResource, ...resources]);
        setResourceOpen(false);
        // Reset fields
        setResTitle("");
        setResDesc("");
        setResUrl("");
        setResStoragePath("");
        setResType("PDF");
        setUploadMethod("FILE");
      } else {
        toast.error(result.error || "Failed to save resource.");
      }
    } catch {
      toast.error("Failed to save resource.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessResource = async (res: ClassroomResource) => {
    if (res.storage_path) {
      try {
        const result = await getSignedResourceUrl(res.storage_path);
        if (!result.success || !result.url) {
          toast.error(result.error || "Failed to generate secure link. Please try again.");
          return;
        }
        const url = result.url;

        // If it is an SVG, fetch and open as an inline blob URL to prevent direct download
        if (res.storage_path.toLowerCase().endsWith(".svg")) {
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch SVG resource");
            const blob = await response.blob();
            const svgBlob = new Blob([blob], { type: "image/svg+xml" });
            const blobUrl = URL.createObjectURL(svgBlob);
            window.open(blobUrl, "_blank");
            return;
          } catch (fetchErr) {
            console.error(
              "Failed to fetch SVG for inline preview, falling back to direct URL open:",
              fetchErr
            );
          }
        }

        // Open in new tab — inline display works because the file was uploaded
        // with the correct Content-Type (e.g. image/svg+xml, application/pdf)
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        toast.error("Failed to generate secure link. Please try again.");
      }
    } else if (res.resource_url) {
      if (res.resource_url.toLowerCase().endsWith(".svg")) {
        try {
          const response = await fetch(res.resource_url);
          if (!response.ok) throw new Error("Failed to fetch SVG resource URL");
          const blob = await response.blob();
          const svgBlob = new Blob([blob], { type: "image/svg+xml" });
          const blobUrl = URL.createObjectURL(svgBlob);
          window.open(blobUrl, "_blank");
          return;
        } catch (fetchErr) {
          console.error(
            "Failed to fetch SVG URL for inline preview, falling back to direct URL open:",
            fetchErr
          );
        }
      }
      window.open(res.resource_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-indigo-600" />
            Classroom Resources
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            Publish worksheets, learning links, videos, and reading materials.
          </p>
        </div>

        <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
          <DialogTrigger
            render={
              <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shadow-sm cursor-pointer">
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload Resource
              </Button>
            }
          />
          <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
            <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
              <DialogTitle className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                Upload Resource
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Provide reference links or upload files from your device.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUploadResource} className="space-y-4 py-6 px-6">
              {/* Method Switcher */}
              <div className="flex gap-2 bg-slate-100 dark:bg-slate-950/40 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod("FILE");
                    setResUrl("");
                    setResStoragePath("");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-xl cursor-pointer transition-all",
                    uploadMethod === "FILE"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod("LINK");
                    setResUrl("");
                    setResStoragePath("");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-xl cursor-pointer transition-all",
                    uploadMethod === "LINK"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  )}
                >
                  <LinkSymbol className="h-3.5 w-3.5" />
                  <span>Share URL Link</span>
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="resTitle"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Resource Title*
                </Label>
                <Input
                  id="resTitle"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  required
                  placeholder="e.g. Solar System Chart"
                  className="rounded-xl h-11 text-sm font-semibold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="resDesc"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Description
                </Label>
                <Input
                  id="resDesc"
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  placeholder="Provide short details about the file..."
                  className="rounded-xl h-11 text-sm font-semibold"
                />
              </div>

              {/* Dynamic Action Selector based on uploadMethod */}
              {uploadMethod === "FILE" ? (
                <div className="space-y-2 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/20 relative">
                  {isUploadingFile ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Uploading file...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="h-10 w-10 bg-indigo-50 dark:bg-slate-800 text-indigo-550 dark:text-indigo-400 rounded-full flex items-center justify-center mb-2">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-slate-650 dark:text-slate-350">
                        <span className="font-black text-indigo-600 dark:text-indigo-400">
                          Click to upload
                        </span>{" "}
                        or drag document here
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        PDF, Word, Images, or Documents (Max 50MB)
                      </p>

                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*,image/svg+xml,.svg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      />
                    </>
                  )}
                  {resUrl && (
                    <div className="mt-4 w-full bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/40 rounded-xl p-2.5 flex items-center justify-between text-left">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-emerald-650 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-50">
                          {resUrl.substring(resUrl.lastIndexOf("/") + 1)}
                        </span>
                      </div>
                      <span className="text-[9px] bg-emerald-100/50 text-emerald-700 px-2 py-0.5 rounded-md font-black">
                        READY
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="resType"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                      >
                        Resource Type
                      </Label>
                      <Select value={resType} onValueChange={(val) => setResType(val || "")}>
                        <SelectTrigger className="w-full rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-850 px-3.5 h-11 bg-background text-sm font-semibold focus:border-indigo-500 focus:ring-0">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDF">PDF File</SelectItem>
                          <SelectItem value="VIDEO">Video Link</SelectItem>
                          <SelectItem value="LINK">Website Link</SelectItem>
                          <SelectItem value="DOCUMENT">Document</SelectItem>
                          <SelectItem value="WORD">Word Document</SelectItem>
                          <SelectItem value="IMAGE">Image File</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="resStoragePath"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                      >
                        Storage Path (Optional)
                      </Label>
                      <Input
                        id="resStoragePath"
                        value={resStoragePath}
                        onChange={(e) => setResStoragePath(e.target.value)}
                        placeholder="Storage key..."
                        className="rounded-xl h-11 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="resUrl"
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                    >
                      Resource URL / Link*
                    </Label>
                    <Input
                      id="resUrl"
                      value={resUrl}
                      onChange={(e) => setResUrl(e.target.value)}
                      required
                      placeholder="https://example.com/file"
                      className="rounded-xl h-11 text-sm font-semibold"
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[32px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResourceOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  loadingText="Saving..."
                  disabled={!resUrl || isUploadingFile || isLoading}
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                >
                  Save Resource
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {resources.length === 0 ? (
        <Card className="rounded-[32px] border-2 border-indigo-150 dark:border-slate-800 bg-indigo-50/5 p-12 text-center">
          <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-950 dark:text-white">
                No classroom resources
              </h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                Upload course documents, guides, or instructional links to support student learning.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => {
            const { displayType, icon, colorClass } = getResourceDisplay(res);

            return (
              <Card
                key={res.id}
                className="rounded-[32px] border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <CardContent className="p-6 md:p-7 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
                          colorClass
                        )}
                      >
                        {icon}
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {displayType}
                        </span>
                        <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight line-clamp-1">
                          {res.title}
                        </h4>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteResource(res.id)}
                      className="h-8 w-8 rounded-full p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {res.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  )}

                  <button
                    onClick={() => handleAccessResource(res)}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-xl w-full border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs h-9 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    )}
                  >
                    <span>Access Resource</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
