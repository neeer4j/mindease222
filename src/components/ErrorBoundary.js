"use client";
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
          ⚠️ Something went wrong. Please refresh the page.
        </div>
      );
    }
    return this.props.children;
  }
}