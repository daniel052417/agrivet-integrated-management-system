// lib/attendanceService.ts
import { supabase } from './supabase';
import { getManilaTimestamp } from './utils/manilaTimestamp';

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  attendance_date: string;
  time_in?: string;
  time_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours: number;
  overtime_hours: number;
  status: string;
  notes?: string;
  created_at: string;
}

export interface CreateAttendanceData {
  staff_id: string;
  attendance_date: string;
  time_in?: string;
  time_out?: string;
  status?: string;
  notes?: string;
}

export interface StaffInfo {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  position: string;
  department: string;
}

export type AttendanceSession = 'morning' | 'afternoon';
export type SessionAction = 'timein' | 'timeout';

export interface SessionInfo {
  session: AttendanceSession;
  action: SessionAction;
  isValid: boolean;
  message?: string;
}

class AttendanceService {
  // Session time ranges (Manila time)
  private readonly MORNING_START = 7; // 7:00 AM
  private readonly MORNING_END = 12; // 12:00 NN
  private readonly AFTERNOON_START = 13; // 1:00 PM
  private readonly AFTERNOON_END = 19; // 7:00 PM
  private normalizeTimestamp(timeInput?: string): string {
    // Always use Manila timestamp for new records
    // If timeInput is provided, it's ignored in favor of current Manila time
    // This ensures all timestamps are based on Manila timezone
    return getManilaTimestamp();
  }

  /**
   * Get today's attendance record for a staff member
   */
  async getTodayAttendance(staffId: string): Promise<AttendanceRecord | null> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('staff_id', staffId)
        .eq('attendance_date', today)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting today attendance:', error);
      throw error;
    }
  }

  /**
   * Record time in for a staff member
   */
  async recordTimeIn(staffId: string, timeIn?: string): Promise<AttendanceRecord> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if record already exists
      const existing = await this.getTodayAttendance(staffId);

      if (existing) {
        // Update existing record
        const timeInIso = this.normalizeTimestamp(timeIn);
        const { data, error } = await supabase
          .from('attendance')
          .update({
            time_in: timeInIso,
            status: 'present',
            check_in_method: 'biometric',
            updated_at: getManilaTimestamp()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const timeInIso = this.normalizeTimestamp(timeIn);
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            staff_id: staffId,
            attendance_date: today,
            time_in: timeInIso,
            status: 'present',
            check_in_method: 'biometric',
            total_hours: 0,
            overtime_hours: 0,
            created_at: getManilaTimestamp(),
            updated_at: getManilaTimestamp()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error recording time in:', error);
      throw error;
    }
  }

  /**
   * Record time out for a staff member
   */
  async recordTimeOut(staffId: string, timeOut?: string): Promise<AttendanceRecord> {
    try {
      const timeOutIso = this.normalizeTimestamp(timeOut);

      // Get today's record
      const existing = await this.getTodayAttendance(staffId);

      if (!existing || !existing.time_in) {
        throw new Error('No time in record found for today. Please record time in first.');
      }

      // Calculate total hours
      const timeInDate = new Date(existing.time_in);
      const timeOutDate = new Date(timeOutIso);
      const totalMinutes = Math.max(0, Math.floor((timeOutDate.getTime() - timeInDate.getTime()) / 60000));
      const totalHours = totalMinutes / 60;
      const overtimeHours = Math.max(0, totalHours - 8); // Assuming 8 hours standard

      // Update record
      const { data, error } = await supabase
        .from('attendance')
        .update({
          time_out: timeOutIso,
          total_hours: parseFloat(totalHours.toFixed(2)),
          overtime_hours: parseFloat(overtimeHours.toFixed(2)),
          status: totalHours >= 8 ? 'present' : existing.status ?? 'present',
          updated_at: getManilaTimestamp()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording time out:', error);
      throw error;
    }
  }

  /**
   * Get current session based on current time in Manila timezone
   */
  getCurrentSession(): AttendanceSession | null {
    const now = new Date();
    const manilaTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      hour12: false
    });
    
    const hour = parseInt(manilaTime.format(now));
    
    if (hour >= this.MORNING_START && hour < this.MORNING_END) {
      return 'morning';
    } else if (hour >= this.AFTERNOON_START && hour < this.AFTERNOON_END) {
      return 'afternoon';
    }
    
    return null;
  }

  /**
   * Get current hour in Manila timezone
   */
  getCurrentManilaHour(): number {
    const now = new Date();
    const manilaTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      hour12: false
    });
    
    return parseInt(manilaTime.format(now));
  }

  /**
   * Determine which action is valid for the current session and attendance record
   */
  getSessionAction(attendance: AttendanceRecord | null, session: AttendanceSession | null): SessionInfo {
    if (!session) {
      const hour = this.getCurrentManilaHour();
      if (hour < this.MORNING_START) {
        return {
          session: 'morning',
          action: 'timein',
          isValid: false,
          message: `Morning session starts at 7:00 AM. Current time is ${hour}:00.`
        };
      } else if (hour >= this.MORNING_END && hour < this.AFTERNOON_START) {
        return {
          session: 'afternoon',
          action: 'timein',
          isValid: false,
          message: `Afternoon session starts at 1:00 PM. Current time is ${hour}:00.`
        };
      } else if (hour >= this.AFTERNOON_END) {
        return {
          session: 'afternoon',
          action: 'timeout',
          isValid: false,
          message: `Afternoon session ends at 7:00 PM. Current time is ${hour}:00.`
        };
      }
    }

    if (session === 'morning') {
      if (!attendance || !attendance.time_in) {
        return {
          session: 'morning',
          action: 'timein',
          isValid: true,
          message: 'Morning Time In'
        };
      } else if (attendance.time_in && !attendance.break_start) {
        return {
          session: 'morning',
          action: 'timeout',
          isValid: true,
          message: 'Morning Time Out'
        };
      } else {
        return {
          session: 'morning',
          action: 'timein',
          isValid: false,
          message: 'Morning session already completed. Please proceed to afternoon session.'
        };
      }
    } else if (session === 'afternoon') {
      if (!attendance || !attendance.time_in) {
        return {
          session: 'afternoon',
          action: 'timein',
          isValid: false,
          message: 'Please complete morning session first.'
        };
      } else if (attendance.time_in && !attendance.break_start) {
        return {
          session: 'afternoon',
          action: 'timein',
          isValid: false,
          message: 'Please complete morning time out first.'
        };
      } else if (attendance.break_start && !attendance.break_end) {
        return {
          session: 'afternoon',
          action: 'timein',
          isValid: true,
          message: 'Afternoon Time In'
        };
      } else if (attendance.break_end && !attendance.time_out) {
        return {
          session: 'afternoon',
          action: 'timeout',
          isValid: true,
          message: 'Afternoon Time Out'
        };
      } else {
        return {
          session: 'afternoon',
          action: 'timeout',
          isValid: false,
          message: 'All sessions completed for today.'
        };
      }
    }

    return {
      session: 'morning',
      action: 'timein',
      isValid: false,
      message: 'Unable to determine session action.'
    };
  }

  /**
   * Record morning time in
   */
  async recordMorningTimeIn(staffId: string, timeIn?: string): Promise<AttendanceRecord> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const timeInIso = this.normalizeTimestamp(timeIn);

      const existing = await this.getTodayAttendance(staffId);

      if (existing) {
        // Update existing record with morning time in
        const { data, error } = await supabase
          .from('attendance')
          .update({
            time_in: timeInIso,
            status: 'present',
            check_in_method: 'biometric',
            updated_at: getManilaTimestamp()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            staff_id: staffId,
            attendance_date: today,
            time_in: timeInIso,
            status: 'present',
            check_in_method: 'biometric',
            total_hours: 0,
            overtime_hours: 0,
            created_at: getManilaTimestamp(),
            updated_at: getManilaTimestamp()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error recording morning time in:', error);
      throw error;
    }
  }

  /**
   * Record morning time out
   */
  async recordMorningTimeOut(staffId: string, timeOut?: string): Promise<AttendanceRecord> {
    try {
      const timeOutIso = this.normalizeTimestamp(timeOut);
      const existing = await this.getTodayAttendance(staffId);

      if (!existing || !existing.time_in) {
        throw new Error('No morning time in record found. Please record morning time in first.');
      }

      if (existing.break_start) {
        throw new Error('Morning time out already recorded.');
      }

      // Calculate morning hours
      const timeInDate = new Date(existing.time_in);
      const timeOutDate = new Date(timeOutIso);
      const morningMinutes = Math.max(0, Math.floor((timeOutDate.getTime() - timeInDate.getTime()) / 60000));
      const morningHours = morningMinutes / 60;

      // Update record with morning time out (stored in break_start)
      const { data, error } = await supabase
        .from('attendance')
        .update({
          break_start: timeOutIso,
          updated_at: getManilaTimestamp()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording morning time out:', error);
      throw error;
    }
  }

  /**
   * Record afternoon time in
   */
  async recordAfternoonTimeIn(staffId: string, timeIn?: string): Promise<AttendanceRecord> {
    try {
      const timeInIso = this.normalizeTimestamp(timeIn);
      const existing = await this.getTodayAttendance(staffId);

      if (!existing || !existing.time_in) {
        throw new Error('No morning time in record found. Please complete morning session first.');
      }

      if (!existing.break_start) {
        throw new Error('No morning time out record found. Please record morning time out first.');
      }

      if (existing.break_end) {
        throw new Error('Afternoon time in already recorded.');
      }

      // Update record with afternoon time in (stored in break_end)
      const { data, error } = await supabase
        .from('attendance')
        .update({
          break_end: timeInIso,
          updated_at: getManilaTimestamp()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording afternoon time in:', error);
      throw error;
    }
  }

  /**
   * Record afternoon time out
   */
  async recordAfternoonTimeOut(staffId: string, timeOut?: string): Promise<AttendanceRecord> {
    try {
      const timeOutIso = this.normalizeTimestamp(timeOut);
      const existing = await this.getTodayAttendance(staffId);

      if (!existing || !existing.time_in) {
        throw new Error('No morning time in record found. Please complete morning session first.');
      }

      if (!existing.break_start) {
        throw new Error('No morning time out record found. Please complete morning session first.');
      }

      if (!existing.break_end) {
        throw new Error('No afternoon time in record found. Please record afternoon time in first.');
      }

      if (existing.time_out) {
        throw new Error('Afternoon time out already recorded.');
      }

      // Calculate total hours for the day
      const morningStart = new Date(existing.time_in);
      const morningEnd = new Date(existing.break_start);
      const afternoonStart = new Date(existing.break_end);
      const afternoonEnd = new Date(timeOutIso);

      const morningMinutes = Math.max(0, Math.floor((morningEnd.getTime() - morningStart.getTime()) / 60000));
      const afternoonMinutes = Math.max(0, Math.floor((afternoonEnd.getTime() - afternoonStart.getTime()) / 60000));
      const totalMinutes = morningMinutes + afternoonMinutes;
      const totalHours = totalMinutes / 60;
      const overtimeHours = Math.max(0, totalHours - 8); // Assuming 8 hours standard

      // Update record with afternoon time out
      const { data, error } = await supabase
        .from('attendance')
        .update({
          time_out: timeOutIso,
          total_hours: parseFloat(totalHours.toFixed(2)),
          overtime_hours: parseFloat(overtimeHours.toFixed(2)),
          status: totalHours >= 8 ? 'present' : existing.status ?? 'present',
          updated_at: getManilaTimestamp()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording afternoon time out:', error);
      throw error;
    }
  }

  /**
   * Record attendance based on session and action
   */
  async recordSessionAttendance(
    staffId: string,
    session: AttendanceSession,
    action: SessionAction,
    time?: string
  ): Promise<AttendanceRecord> {
    if (session === 'morning') {
      if (action === 'timein') {
        return this.recordMorningTimeIn(staffId, time);
      } else {
        return this.recordMorningTimeOut(staffId, time);
      }
    } else {
      if (action === 'timein') {
        return this.recordAfternoonTimeIn(staffId, time);
      } else {
        return this.recordAfternoonTimeOut(staffId, time);
      }
    }
  }

  /**
   * Get staff information by ID
   */
  async getStaffInfo(staffId: string): Promise<StaffInfo | null> {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, employee_id, position, department')
        .eq('id', staffId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting staff info:', error);
      throw error;
    }
  }
}

export const attendanceService = new AttendanceService();

