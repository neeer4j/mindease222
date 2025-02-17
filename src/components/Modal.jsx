"use client";

import React, { useEffect, useRef } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';

export default function Modal({ children, onClose }) {
  const modalRoot = useRef(null);

  useEffect(() => {
    // Find first focusable element
    const focusableElements = modalRoot.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements?.[0];
    
    // Focus first element when modal opens
    firstFocusable?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (modalRoot.current) {
      modalRoot.current.style.overflow = 'hidden';
    }
    return () => {
      if (modalRoot.current) {
        modalRoot.current.style.overflow = 'auto';
      }
    };
  }, [modalRoot]);

  return createPortal(
    <div 
      ref={modalRoot}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close Modal"
          type="button"
        >
          <span className="sr-only">Close</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {children}
      </div>
    </div>,
    document.body
  );
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};
