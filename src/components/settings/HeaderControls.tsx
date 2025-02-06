"use client";

import { Download, Upload, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

const BASE_STORAGE_KEY = "subscriptions";

function Controls({
  theme,
  toggleTheme,
  mounted,
  storageActions,
}: {
  theme: string;
  toggleTheme: () => void;
  mounted: boolean;
  storageActions: {
    importData: (data: unknown) => Promise<void>;
    exportData: () => void;
  };
}) {
  const handleImport = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await storageActions.importData(data);
      } catch (error) {
        console.error("Error importing data:", error);
        alert("Error importing data. Please check the file format.");
      }
    };

    input.click();
  }, [storageActions]);

  return (
    <div className="flex justify-end gap-2">
      <HeaderButton onClick={handleImport} aria-label="Import subscriptions">
        <Upload size={20} strokeWidth={1.5} />
      </HeaderButton>

      <HeaderButton
        onClick={storageActions.exportData}
        aria-label="Export subscriptions"
      >
        <Download size={20} strokeWidth={1.5} />
      </HeaderButton>

      <HeaderButton onClick={toggleTheme} aria-label="Toggle theme">
        {mounted &&
          (theme === "dark" ? (
            <Sun size={20} strokeWidth={1.5} />
          ) : (
            <Moon size={20} strokeWidth={1.5} />
          ))}
      </HeaderButton>
    </div>
  );
}

function HeaderButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-10 h-10 rounded-full flex items-center justify-center
        text-foreground/70 hover:text-foreground dark:text-foreground/60 dark:hover:text-foreground transition-colors duration-200"
    >
      {children}
    </button>
  );
}

export function HeaderControls() {
  const { theme, toggleTheme, mounted } = useTheme();
  const { data: session } = useSession();
  const { toast } = useToast();

  const getStorageKey = () => {
    if (!session?.user?.id) return null;
    return `${BASE_STORAGE_KEY}_${session.user.id}`;
  };

  return (
    <Controls
      theme={theme}
      mounted={mounted}
      toggleTheme={toggleTheme}
      storageActions={{
        importData: async (data) => {
          const storageKey = getStorageKey();
          if (!storageKey) {
            toast({
              title: "Error",
              description: "You must be logged in to import data",
              variant: "destructive",
            });
            return;
          }

          try {
            // Validate the imported data structure
            if (!Array.isArray(data)) {
              throw new Error("Invalid data format: expected an array");
            }

            localStorage.setItem(storageKey, JSON.stringify(data));
            window.location.reload();
            toast({
              title: "Success",
              description: "Subscriptions imported successfully",
            });
          } catch (error) {
            console.error("Error importing data:", error);
            toast({
              title: "Error",
              description:
                "Failed to import data. Please check the file format.",
              variant: "destructive",
            });
          }
        },
        exportData: () => {
          const storageKey = getStorageKey();
          if (!storageKey || !session?.user?.email) {
            toast({
              title: "Error",
              description: "You must be logged in to export data",
              variant: "destructive",
            });
            return;
          }

          try {
            const data = localStorage.getItem(storageKey) || "[]";
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            // Use a default name if email is not available (shouldn't happen due to the check above)
            const filename = session.user.email
              ? `subscriptions_${session.user.email.split("@")[0]}.json`
              : "subscriptions_export.json";
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
              title: "Success",
              description: "Subscriptions exported successfully",
            });
          } catch (error) {
            console.error("Error exporting data:", error);
            toast({
              title: "Error",
              description: "Failed to export data",
              variant: "destructive",
            });
          }
        },
      }}
    />
  );
}
