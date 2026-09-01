"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw, Trash2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  icon?: React.ComponentType<{ className?: string }>;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "warning",
  icon: Icon,
}: ConfirmModalProps) {
  const DefaultIcon =
    variant === "destructive"
      ? Trash2
      : variant === "warning"
      ? RotateCcw
      : AlertCircle;

  const ActiveIcon = Icon || DefaultIcon;

  const getMediaStyles = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive/15 text-destructive";
      case "warning":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
      default:
        return "bg-primary/15 text-primary";
    }
  };

  const getActionStyles = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
      case "warning":
        return "bg-amber-600 hover:bg-amber-500 text-white";
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={cn(getMediaStyles())}>
            <ActiveIcon className="w-6 h-6" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(getActionStyles())}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
