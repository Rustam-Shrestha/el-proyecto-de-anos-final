import React from 'react';
import Modal from './Modal';
import AlertBox from './AlertBox';
import Button from './Button';

export interface NotificationModalProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  isOpen?: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  type = 'info',
  title,
  message,
  isOpen = true,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <div className="space-y-4">
        <AlertBox type={type} message={message} />
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationModal;
