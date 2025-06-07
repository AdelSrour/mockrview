import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { WebrtcService } from './services/webrtc.service';
import { CommonModule } from '@angular/common';
import { MatchMakingService } from './services/match-making.service';

@Component({
  selector: 'app-room',
  imports: [CommonModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss'
})
export class RoomComponent implements OnDestroy, OnInit  {
  
  // Use the webRTC service
  constructor(private webRtcService: WebrtcService, private matchMaking: MatchMakingService) {}

  /**
   * Current Status
   * 0 - Search for match (Display loading screen (searching for a match))
   * 1 - Asking for video permission
   * 2 - Connected to match (show option to disconnect and display the video)
   * 3 - Disconnected (show option to search for new match)
   */
  status: number = 0;

  /**
   * Storage for error messages such as camera permission denied
   */
  errorMessages: any;

  //LocalVideo element
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;

  //RemoteVideo Element
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;


  /* Matching logic */
  ngOnInit() {
    this.startMatchMaking();
  }

  startMatchMaking() {
       // Function to be executed once a match is found
       this.matchMaking.initMatchingSystem((sessionId, callerRole) => {
        // We join the room once a match is found using the session id (we have matchedWith which is the userID (random string) maybe we can make use of it)
        this.joinRoom(sessionId, callerRole);
      });
    
      // Start match making
      this.status = 0; // Set status to searching
      // Start searching for a match based on these options
      
      let role = sessionStorage.getItem("role") || ""; //We get user role from sessionStorage
      let tags = sessionStorage.getItem("tags") || "{}"; //We get tags from sessionStorage
      let parsedtags = JSON.parse(tags);
  
      this.matchMaking.joinWaitingPool(role, parsedtags)
        .then(userId => console.log(`Joined as ${userId}`)) // Here we joined successfully to match making pool
        .catch(err => console.log(err)); // Something went wrong maybe a db issue or internet issue
  }

  /**
   * Function called to join a room with spesfic ID (auto generated when match is found)
   */
  async joinRoom(roomID: string, callerRole:string) {
    try {
      // Change status preparing camera and mic permissions
      this.status = 1;
      // Clear error messages
      this.errorMessages = "" 

      // Hotfix for reconnecting (I will change it 0)
      let delayBased = callerRole == "interviewee" ? 1000 : 0;

      // Start video (will ask for permission for camera access)
      await setTimeout( async() => {
        await this.webRtcService.joinRoom(
          roomID,
          this.localVideo.nativeElement,
          this.remoteVideo.nativeElement,
          () => { this.leaveRoom() },// This gets triggered when remote host leaves
          
        );
      }, delayBased);

      // Connected successfully to camera and microphone and started peer connection
      this.status = 2;
    } catch (error) {
      // If join room fail error will be shown here, display it to user
      // If user said no to camera permission this will be triggered
      this.errorMessages = error;
      console.log('Error joining room:', error);

      //Lets return to status 0 on error ? not sure can be based on conditions later
      this.status = 0;
    }
  }

  /**
   * Destroy the room and disconnect from remote host
   */
  leaveRoom() {
    this.webRtcService.leaveRoom();
    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;
    this.status = 3 // Change the status to disconnected
  }

  ngOnDestroy(): void {
    // When ever we leave the room page we disconnect
    this.leaveRoom();
  }
}
