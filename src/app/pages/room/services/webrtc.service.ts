import { Injectable, OnDestroy } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { getDatabase, ref, set, push, onValue, off, remove, Database, get, onDisconnect } from 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  // DB instance
  private database: Database;

  // Local Steam for user
  private localStream: MediaStream | null = null;

  // Remote stream for remote host
  private remoteStream: MediaStream | null = null;

  // WebRTC instance
  private peerConnection: RTCPeerConnection | null = null;

  // Room ID
  private roomId: string = '';

  // Check if user is the caller
  private isCaller: boolean = false;

  // Firestore signalRef
  private signalsRef: any = null;

  /* ICE Configiration */
  private iceCandidateQueue: any[] = [];
  private iceCandidateTimeout: any = null;
  private servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  };

  constructor(private fs: Firestore) {
    // start firestore db
    this.database = getDatabase();
  }

  /**
  * Ask the user for a permission to access microphone and camera
  * Display the user data into video element
  * @param localVideoElement - video element that user video will be shown at
  */
  async setupLocalStream(localVideoElement: HTMLVideoElement): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localVideoElement.srcObject = this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw new Error("Could not access camera/microphone. Please check permissions.");
    }
  }

  /**
   * 
   * @param remoteVideoElement - The video element were the remote user data will be shown at
   */
  private setupPeerConnection(remoteVideoElement: HTMLVideoElement): void {
    this.peerConnection = new RTCPeerConnection(this.servers);

    // Take all my own video data and send it to the remote stream
    this.localStream?.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream as MediaStream);
    });

    // When any data arrives from remote stream, show it into the remote stream video element
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      remoteVideoElement.srcObject = this.remoteStream;
    };

    // When a new ICE data gets generated lets make sure we send it to remote user
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.iceCandidateQueue.push(event.candidate);
    
        if (!this.iceCandidateTimeout) {
          this.iceCandidateTimeout = setTimeout(() => {
            const batch = [...this.iceCandidateQueue];
            this.iceCandidateQueue = [];
            this.iceCandidateTimeout = null;
    
            //Send each ICE every 1 second to prevent a spam
            batch.forEach(candidate => {
              this.sendSignal({
                type: "candidate",
                candidate: {
                  candidate: candidate.candidate,
                  sdpMid: candidate.sdpMid,
                  sdpMLineIndex: candidate.sdpMLineIndex,
                  usernameFragment: candidate.usernameFragment,
                },
              });
            });
          }, 1000);
        }
      }
    };
  }

  /**
   * Now we take the ICE data and send it to firebase so the other user can fetch it
   * @param data - ICE data
   */
  private sendSignal(data: any): void {

    // Store the data into roomID
    const signalsRef = ref(this.database, `rooms/${this.roomId}/signals`);
    
    // Send the data based on its type, and sender type so we dont replay to ourselfs
    if (data.type === "candidate") {
      push(signalsRef, {
        sender: this.isCaller ? "caller" : "callee",
        data: {
          type: "candidate",
          candidate: {
            candidate: data.candidate.candidate,
            sdpMid: data.candidate.sdpMid,
            sdpMLineIndex: data.candidate.sdpMLineIndex,
            usernameFragment: data.candidate.usernameFragment,
          },
        },
      });
    } else {
      push(signalsRef, {
        sender: this.isCaller ? "caller" : "callee",
        data: data,
      });
    }
  }

  /**
   * Now lets listen for data coming from firestore
   */
  private listenForSignals(): void {
    // We get the data from firebase roomID
    this.signalsRef = ref(this.database, `rooms/${this.roomId}/signals`);
    
    // On any value change we read new changes
    onValue(this.signalsRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const signal = childSnapshot.val();
    
        // We only process signal coming from remote not our signal
        if (
          (this.isCaller && signal.sender === "callee") ||
          (!this.isCaller && signal.sender === "caller")
        ) {
          // Send the signal to handle function
          this.handleSignal(signal.data);
        
          // Lets clean up the firebase data after the signal has been processed
          const signalRef = ref(this.database, `rooms/${this.roomId}/signals/${key}`);
          remove(signalRef);
        }
      });
    });
  }

  /**
   * 
   * @param data - the data coming from firestore which contains the signal
   * @returns 
   */
  private async handleSignal(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      switch (data.type) {
        case "offer":
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          this.sendSignal({
            type: "answer",
            answer: answer,
          });
          break;

        case "answer":
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          break;

        case "candidate":
          const candidateData = {
            candidate: data.candidate.candidate,
            sdpMid: data.candidate.sdpMid || null,
            sdpMLineIndex: data.candidate.sdpMLineIndex || null,
            usernameFragment: data.candidate.usernameFragment || null,
          };
          await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidateData)
          );
          break;
      }
    } catch (error) {
      console.error("Signal handling error:", error);
    }
  }

  /**
   * 
   * @param roomId - The common ID between two users
   * @param localVideoElement - The video HTML element used to display the user data
   * @param remoteVideoElement - The video HTML element used to display the remote user data
   */
  async joinRoom(
    roomId: string,
    localVideoElement: HTMLVideoElement,
    remoteVideoElement: HTMLVideoElement,
    callback: () => void
  ): Promise<void> {
    this.roomId = roomId.trim();
    if (!this.roomId) throw new Error("Please enter a room ID");  
    await this.setupLocalStream(localVideoElement);


    // Check if room exists (someone is already there)
    const roomRef = ref(this.database, `rooms/${this.roomId}`); 
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      // Room exists - join as callee
      this.isCaller = false;
    } else {
      // Room doesn't exist - create as caller
      this.isCaller = true;
      await set(roomRef, { created: true });
    }

    const disconnectRef = ref(this.database, `rooms/${this.roomId}`);
    onDisconnect(disconnectRef).remove();

    this.setupPeerConnection(remoteVideoElement);
    this.listenForSignals();


    if (this.isCaller) {
      // Caller creates the offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      this.sendSignal({
        type: "offer",
        offer: offer,
      });
    }

    this.onRoomDeleted(this.roomId, callback);

  }

  // Leave the current room
  leaveRoom(): void {
    this.cleanUp();
  }

  // Clean up resources
  private cleanUp(): void {
    // Clean up peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Stop listening for signals
    if (this.signalsRef) {
      off(this.signalsRef);
      this.signalsRef = null;
    }

    if (this.roomDeleteSub) {
      this.roomDeleteSub();
      this.roomDeleteSub = null;
    }

    // Remove room if any party leave
    if (this.roomId) {
      const roomRef = ref(this.database, `rooms/${this.roomId}`);
      remove(roomRef);
    }

    this.roomId = '';
  }

  /* Clean up once service is destroyed */
  ngOnDestroy(): void {
    this.cleanUp();
  }

  // Lets detect when one of the users leave the room
  private roomDeleteSub: (() => void) | null = null;
  onRoomDeleted(myRoom:string, callback: () => void): void {
    const roomRef = ref(this.database, `rooms/${myRoom}`);
    onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback();
      }
    });
    this.roomDeleteSub = () => off(roomRef);
  }
}
