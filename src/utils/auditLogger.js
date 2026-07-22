import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Logs an action to the strictly immutable audit_logs collection.
 * 
 * @param {string} userEmail - The email of the user performing the action
 * @param {string} action - The action type (e.g., 'ADDED_MEMBER', 'DELETED_TRANSACTION')
 * @param {string} details - A human readable description of what happened
 */
export async function logAudit(userEmail, action, details) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userEmail: userEmail || 'unknown@skcet.ac.in',
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // We swallow the error so that app functionality isn't strictly broken if logging fails, 
    // but in a real enterprise app, you might want to throw it.
  }
}
