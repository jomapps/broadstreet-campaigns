/**
 * APP STORE - APPLICATION-WIDE STATE MANAGEMENT
 * 
 * This store manages application-wide state like sidebar, notifications, and UI state.
 * All variable names follow docs/variable-origins.md registry.
 * 
 * CRITICAL RULES:
 * 1. All variable names from docs/variable-origins.md registry
 * 2. Notification management with proper typing
 * 3. UI state persistence for better UX
 * 4. No TypeScript types - using plain JavaScript with JSDoc
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { AppState, AppActions, AppStore, Notification } from './types';

// Initial state with proper typing and comprehensive coverage
// Variable names follow docs/variable-origins.md registry
const initialState = {
  sidebarCollapsed: false,
  currentPage: '',
  notifications: [],
};

/**
 * App Store - Manages application-wide state
 * Uses Zustand with Immer for immutable updates and persistence
 */
export const useAppStore = create(
  persist(
    immer((set, get) => ({
      ...initialState,

      // UI State Management
      // Variable names follow docs/variable-origins.md registry

      /**
       * Set sidebar collapsed state
       * @param {boolean} collapsed - Whether sidebar should be collapsed
       */
      setSidebarCollapsed: (collapsed) => set((state) => {
        state.sidebarCollapsed = collapsed;
      }),

      /**
       * Toggle sidebar collapsed state
       */
      toggleSidebar: () => set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),

      /**
       * Set current page identifier
       * @param {string} page - Page identifier/route
       */
      setCurrentPage: (page) => set((state) => {
        state.currentPage = page;
      }),

      // Notification Management
      // Variable names follow docs/variable-origins.md registry

      /**
       * Add notification to the notifications array
       * @param {Omit<Notification, 'id' | 'timestamp' | 'read'>} notification - Notification data
       */
      addNotification: (notification) => set((state) => {
        const newNotification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
        };
        
        state.notifications.unshift(newNotification);
        
        // Keep only last 50 notifications to prevent memory issues
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }
      }),

      /**
       * Mark notification as read
       * @param {string} id - Notification ID to mark as read
       */
      markNotificationRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          notification.read = true;
        }
      }),

      /**
       * Mark all notifications as read
       */
      markAllNotificationsRead: () => set((state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
      }),

      /**
       * Remove notification by ID
       * @param {string} id - Notification ID to remove
       */
      removeNotification: (id) => set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      }),

      /**
       * Clear all notifications
       */
      clearAllNotifications: () => set((state) => {
        state.notifications = [];
      }),

      /**
       * Remove all read notifications
       */
      clearReadNotifications: () => set((state) => {
        state.notifications = state.notifications.filter(n => !n.read);
      }),

      // Notification Utility Methods

      /**
       * Get unread notification count
       * @returns {number} Number of unread notifications
       */
      getUnreadCount: () => {
        const state = get();
        return state.notifications.filter(n => !n.read).length;
      },

      /**
       * Get notifications by type
       * @param {string} type - Notification type to filter by
       * @returns {Notification[]} Array of notifications of specified type
       */
      getNotificationsByType: (type) => {
        const state = get();
        return state.notifications.filter(n => n.type === type);
      },

      /**
       * Get recent notifications (last 10)
       * @returns {Notification[]} Array of recent notifications
       */
      getRecentNotifications: () => {
        const state = get();
        return state.notifications.slice(0, 10);
      },

      /**
       * Check if there are any error notifications
       * @returns {boolean} True if there are unread error notifications
       */
      hasErrorNotifications: () => {
        const state = get();
        return state.notifications.some(n => n.type === 'error' && !n.read);
      },

      // Convenience Methods for Common Notification Types

      /**
       * Add success notification
       * @param {string} title - Notification title
       * @param {string} message - Notification message
       */
      addSuccessNotification: (title, message) => {
        get().addNotification({
          type: 'success',
          title,
          message,
        });
      },

      /**
       * Add error notification
       * @param {string} title - Notification title
       * @param {string} message - Notification message
       */
      addErrorNotification: (title, message) => {
        get().addNotification({
          type: 'error',
          title,
          message,
        });
      },

      /**
       * Add warning notification
       * @param {string} title - Notification title
       * @param {string} message - Notification message
       */
      addWarningNotification: (title, message) => {
        get().addNotification({
          type: 'warning',
          title,
          message,
        });
      },

      /**
       * Add info notification
       * @param {string} title - Notification title
       * @param {string} message - Notification message
       */
      addInfoNotification: (title, message) => {
        get().addNotification({
          type: 'info',
          title,
          message,
        });
      },

      // App State Utility Methods

      /**
       * Get app summary for debugging
       * @returns {Object} App state summary
       */
      getAppSummary: () => {
        const state = get();
        return {
          sidebarCollapsed: state.sidebarCollapsed,
          currentPage: state.currentPage,
          totalNotifications: state.notifications.length,
          unreadNotifications: state.notifications.filter(n => !n.read).length,
          errorNotifications: state.notifications.filter(n => n.type === 'error').length,
        };
      },

      /**
       * Reset app state to initial values (except notifications)
       */
      resetAppState: () => set((state) => {
        state.sidebarCollapsed = initialState.sidebarCollapsed;
        state.currentPage = initialState.currentPage;
        // Keep notifications - they should be explicitly cleared
      }),

      /**
       * Get sidebar state
       * @returns {boolean} Current sidebar collapsed state
       */
      getSidebarState: () => {
        const state = get();
        return state.sidebarCollapsed;
      },

      /**
       * Get current page
       * @returns {string} Current page identifier
       */
      getCurrentPage: () => {
        const state = get();
        return state.currentPage;
      },

      /**
       * Auto-remove old notifications (older than 7 days)
       */
      cleanupOldNotifications: () => set((state) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        state.notifications = state.notifications.filter(
          notification => notification.timestamp > sevenDaysAgo
        );
      }),
    })),
    {
      name: 'broadstreet-app',
      // Only persist essential app state, not all notifications
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        // Don't persist currentPage - it should be determined by routing
        // Don't persist all notifications - only keep recent ones
        notifications: state.notifications.slice(0, 10),
      }),
    }
  )
);
