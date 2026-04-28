// @ts-nocheck
import { useCallback, useState } from "react";

export const useConfirmationDialog = () => {
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "default",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isLoading: false,
  });

  const openDialog = useCallback((config) => {
    setDialogConfig({
      isOpen: true,
      title: config.title || "Confirm Action",
      message: config.message || "Are you sure you want to proceed?",
      onConfirm: config.onConfirm,
      type: config.type || "default",
      confirmText: config.confirmText || "Confirm",
      cancelText: config.cancelText || "Cancel",
      isLoading: false,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const setLoading = useCallback((isLoading) => {
    setDialogConfig((prev) => ({ ...prev, isLoading }));
  }, []);

  const handleConfirm = async () => {
    if (dialogConfig.onConfirm) {
      setLoading(true);
      try {
        await dialogConfig.onConfirm();
        closeDialog();
      } catch (error) {
        console.error("Confirmation action failed:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    dialogConfig: {
      ...dialogConfig,
      onConfirm: handleConfirm,
      onClose: closeDialog,
    },
    openDialog,
    closeDialog,
    setLoading,
  };
};
