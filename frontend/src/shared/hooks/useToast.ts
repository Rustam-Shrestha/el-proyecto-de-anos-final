import PopMessage from "@components/PopMessage";

export const useToast = () => {
  return {
    success: (message: string) => PopMessage.success(message),
    error: (message: string) => PopMessage.error(message),
    warning: (message: string) => PopMessage.warning(message),
    info: (message: string) => PopMessage.warning(message),
  };
};