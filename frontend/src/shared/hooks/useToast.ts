import PopMessage from '@/components/PopMessage';

export const useToast = () => {
  const showSuccess = (message: string) => PopMessage.success(message);
  const showError = (message: string) => PopMessage.error(message);
  const showWarning = (message: string) => PopMessage.warning(message);
  const showInfo = (message: string) => PopMessage.warning(message);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  };
};

export default useToast;