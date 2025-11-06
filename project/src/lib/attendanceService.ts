// lib/attendanceService.ts
import { supabase } from './supabase';

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

class AttendanceService {
  /**
   * Get today's attendance record for a staff member
   */
  async getTodayAttendance(staffId: string): Promise<AttendanceRecord | null> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const { data, error } = await supabase
        .from('attendance_records')
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
      const timeInValue = timeIn || new Date().toTimeString().split(' ')[0]; // HH:MM:SS

      // Check if record already exists
      const existing = await this.getTodayAttendance(staffId);

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('attendance_records')
          .update({
            time_in: timeInValue,
            status: 'present'
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance_records')
          .insert({
            staff_id: staffId,
            attendance_date: today,
            time_in: timeInValue,
            status: 'present',
            total_hours: 0,
            overtime_hours: 0
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
      const today = new Date().toISOString().split('T')[0];
      const timeOutValue = timeOut || new Date().toTimeString().split(' ')[0]; // HH:MM:SS

      // Get today's record
      const existing = await this.getTodayAttendance(staffId);

      if (!existing || !existing.time_in) {
        throw new Error('No time in record found for today. Please record time in first.');
      }

      // Calculate total hours
      const timeInDate = new Date(`${today}T${existing.time_in}`);
      const timeOutDate = new Date(`${today}T${timeOutValue}`);
      const totalMinutes = Math.floor((timeOutDate.getTime() - timeInDate.getTime()) / 60000);
      const totalHours = totalMinutes / 60;
      const overtimeHours = Math.max(0, totalHours - 8); // Assuming 8 hours standard

      // Update record
      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          time_out: timeOutValue,
          total_hours: parseFloat(totalHours.toFixed(2)),
          overtime_hours: parseFloat(overtimeHours.toFixed(2))
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

