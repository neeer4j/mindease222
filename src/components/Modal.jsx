"use client";

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

export default function Modal({ children, onClose }) {
  // Reference to the modal root in the HTML
  const modalRoot = typeof window !== 'undefined' ? document.getElementById('modal-root') : null;

  // Create a div to serve as the modal container
  const el = React.useRef(document.createElement('div'));

  useEffect(() => {
    if (!modalRoot) return;

    // Append the modal container to the modal root
    modalRoot.appendChild(el.current);

    // Cleanup function to remove the modal container when unmounting
    return () => {
      modalRoot.removeChild(el.current);
    };
  }, [modalRoot]);

  useEffect(() => {
    // Function to handle the Escape key press to close the modal
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add event listener for keydown
    document.addEventListener('keydown', onEsc);

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  // Prevent scrolling when the modal is open
  useEffect(() => {
    if (modalRoot) {
      modalRoot.style.overflow = 'hidden';
    }
    return () => {
      if (modalRoot) {
        modalRoot.style.overflow = 'auto';
      }
    };
  }, [modalRoot]);

  // Modal content
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close Modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        {children}
      </div>
    </div>
  );

  // Render the modal using React Portal
  return modalRoot ? ReactDOM.createPortal(modalContent, el.current) : null;
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};
