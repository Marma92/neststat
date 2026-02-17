/**
 * Reservation business rules configuration
 * Adjust these values to match your organization's policies
 */
export const RESERVATION_CONFIG = {
  /**
   * Maximum reservation duration in hours
   * Prevents users from booking rooms for excessively long periods
   */
  MAX_DURATION_HOURS: parseInt(process.env.MAX_RESERVATION_HOURS || '8', 10),

  /**
   * Minimum advance booking time in minutes
   * Users must book at least this many minutes in advance
   */
  MIN_ADVANCE_MINUTES: parseInt(
    process.env.MIN_ADVANCE_BOOKING_MINUTES || '15',
    10,
  ),

  /**
   * Buffer time between reservations in minutes
   * Allows time for cleanup/setup between bookings
   */
  BUFFER_TIME_MINUTES: parseInt(process.env.BUFFER_TIME_MINUTES || '15', 10),

  /**
   * Business hours configuration
   * Format: { start: hour (0-23), end: hour (0-23) }
   */
  BUSINESS_HOURS: {
    START: parseInt(process.env.BUSINESS_HOURS_START || '8', 10), // 8 AM
    END: parseInt(process.env.BUSINESS_HOURS_END || '20', 10), // 8 PM
  },

  /**
   * Maximum days in advance a reservation can be made
   * 0 means unlimited
   */
  MAX_ADVANCE_DAYS: parseInt(process.env.MAX_ADVANCE_BOOKING_DAYS || '90', 10),

  /**
   * Enable/disable business hours enforcement
   */
  ENFORCE_BUSINESS_HOURS: process.env.ENFORCE_BUSINESS_HOURS !== 'false',
};

/**
 * Helper to get buffer time in milliseconds
 */
export const getBufferTimeMs = () =>
  RESERVATION_CONFIG.BUFFER_TIME_MINUTES * 60 * 1000;

/**
 * Helper to get minimum advance time in milliseconds
 */
export const getMinAdvanceMs = () =>
  RESERVATION_CONFIG.MIN_ADVANCE_MINUTES * 60 * 1000;

/**
 * Helper to get maximum duration in milliseconds
 */
export const getMaxDurationMs = () =>
  RESERVATION_CONFIG.MAX_DURATION_HOURS * 60 * 60 * 1000;
