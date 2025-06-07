import { Injectable, OnDestroy } from '@angular/core';
import { getDatabase, ref, set, onValue, remove, onDisconnect, serverTimestamp, off, Database } from 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class MatchMakingService implements OnDestroy {
  // DB instance
  private database: Database;

  // Storage for the random userID
  private userId: string | null = null;

  // Role
  private role: string | null = null;

  // Tags
  private tags: string[] = [];

  // Listener for unsub
  private matchListenerUnsubscribe: (() => void) | null = null;

  // Call back function when match is found
  private matchCallback: (sessionId: string, callerRole: string) => void = () => {};

  constructor() {
    // Start database
    this.database = getDatabase();
  }

  // Clean up on service close
  ngOnDestroy(): void {
    this.cleanupUser();
  }

/**
 * A callback function sent to be triggered once a match is found
 * @param callback 
 */
  initMatchingSystem(callback: (sessionId: string, callerRole: string) => void) {
    this.matchCallback = callback || (() => { });
  }
  private handleMatchFound(sessionId: string, callerRole: string) {
    this.teardownMatchListener();
    this.matchCallback(sessionId, callerRole);
  }

  /**
   * Generate a new userID if it doesn't exist in session storage
   * @returns - new userid
   */
  private generateUserId(): string {
    const existingId = sessionStorage.getItem("userID");
    if (existingId) return existingId;

    const newId = 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
    sessionStorage.setItem("userID", newId);
    return newId;
  }

  /**
   * Create a user in db and set it as waiting for role
   * @param role - The user rule interviewer or interviewee
   * @param tags - tags
   * @returns 
   */
  async joinWaitingPool(role: string, tags: string[]): Promise<string> {
    if (!role || !tags.length) {
      throw new Error("Role and at least one tag are required");
    }

    this.userId = this.generateUserId();
    this.role = role;
    this.tags = tags;

    const userRef = ref(this.database, `waitingUsers/${this.userId}`);

    await set(userRef, {
      userId: this.userId,
      role: this.role,
      tags: this.tags,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      matched: false,
      matchedWith: null,
      sessionId: null,
      online: true,
    });

    onDisconnect(userRef).remove();
    this.setupMatchListener();

    return this.userId;
  }

  /**
   * Remove user data from db once they leave
   * @returns 
   */
  async cleanupUser(): Promise<void> {
    if (!this.userId) return;

    const userRef = ref(this.database, `waitingUsers/${this.userId}`);
    onDisconnect(userRef).cancel();
    await remove(userRef);
    this.teardownMatchListener();
  }

  /**
   * Listen for matches found
   * @returns 
   */
  private setupMatchListener() {
    if (!this.userId) return;

    const userRef = ref(this.database, `waitingUsers/${this.userId}`);

    this.teardownMatchListener(); // remove old one if exists

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.matched) {
        this.handleMatchFound(data.sessionId, data.role);
      }
    });

    this.matchListenerUnsubscribe = () => {
      off(userRef);
    };
  }

  /**
   * Remove match listener
   */
  private teardownMatchListener() {
    if (this.matchListenerUnsubscribe) {
      this.matchListenerUnsubscribe();
      this.matchListenerUnsubscribe = null;
    }
  }
}
