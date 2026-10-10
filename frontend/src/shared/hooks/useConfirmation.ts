import { useState, useCallback } from 'react';

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resolver, setResolver] = useState<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((confirmMessage: string): Promise<boolean> => {
    setMessage(confirmMessage);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolver) resolver(true);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolver) resolver(false);
  }, [resolver]);

  return {
    confirm,
    isOpen,
    message,
    handleConfirm,
    handleCancel,
  };
};

export default useConfirmation;
