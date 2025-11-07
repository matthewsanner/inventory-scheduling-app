import { Modal, Button, ModalHeader, ModalBody } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

const DeleteEventModal = ({ open, onClose, onConfirm, eventName }) => {
  return (
    <Modal data-testid="delete-modal" show={open} onClose={onClose} popup>
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
          <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <strong>{eventName}</strong>? This
            action cannot be undone.
          </h3>
          <div className="flex justify-center gap-4">
            <Button color="red" onClick={onConfirm}>
              Yes, I&apos;m sure
            </Button>
            <Button color="light" onClick={onClose}>
              No, cancel
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default DeleteEventModal;

