import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { WebrtcService } from "../../shared/services/webrtc.service";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { MatchMakingService } from "../../shared/services/match-making.service";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-room",
  imports: [CommonModule, RouterLink, TitleCasePipe],
  templateUrl: "./room.component.html",
  styleUrl: "./room.component.scss",
})
export class RoomComponent implements OnDestroy, OnInit {
  // Use the webRTC service
  constructor(
    private webRtcService: WebrtcService,
    private matchMaking: MatchMakingService,
    private route: Router
  ) {}

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
  /**
   * Timer functionality
   */
  interviewStartTime: Date | null = null;
  timerInterval: any;
  currentTime: string = "00:00:00";

  /**
   * Video status tracking
   */
  hasLocalVideo: boolean = false;
  hasRemoteVideo: boolean = false;

  /**
   * User search preferences
   */
  userRole: string = "";
  userTags: string[] = [];

  //LocalVideo element
  @ViewChild("localVideo") localVideo!: ElementRef<HTMLVideoElement>;

  //RemoteVideo Element
  @ViewChild("remoteVideo") remoteVideo!: ElementRef<HTMLVideoElement>;

  /* Matching logic */
  ngOnInit() {
    this.startMatchMaking();
  }

  startMatchMaking() {
    let role = sessionStorage.getItem("role") || ""; //We get user role from sessionStorage
    let tags = sessionStorage.getItem("tags") || "[]"; //We get tags from sessionStorage
    let parsedtags = JSON.parse(tags);

    if (parsedtags.length == 0 || tags == "") {
      this.route.navigate(["/"]);
      return;
    }

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

    // Store user preferences for display
    this.userRole = role;
    this.userTags = Array.isArray(parsedtags)
      ? parsedtags
      : Object.values(parsedtags || {});

    this.matchMaking
      .joinWaitingPool(role, parsedtags)
      .then((userId) => console.log(`Joined as ${userId}`)) // Here we joined successfully to match making pool
      .catch((err) => console.log(err)); // Something went wrong maybe a db issue or internet issue
  }

  /**
   * Function called to join a room with spesfic ID (auto generated when match is found)
   */
  async joinRoom(roomID: string, callerRole: string) {
    try {
      // Change status preparing camera and mic permissions
      this.status = 1;
      // Clear error messages
      this.errorMessages = "";

      // Hotfix for reconnecting (I will change it 0)
      let delayBased = callerRole == "interviewee" ? 1000 : 0;

      // Start video (will ask for permission for camera access)
      await setTimeout(async () => {
        await this.webRtcService.joinRoom(
          roomID,
          this.localVideo.nativeElement,
          this.remoteVideo.nativeElement,
          () => {
            this.leaveRoom();
          } // This gets triggered when remote host leaves
        );
      }, delayBased);

      // Connected successfully to camera and microphone and started peer connection
      this.status = 2;
      this.startTimer();

      // Set up video status tracking after DOM is updated
      setTimeout(() => {
        this.setupVideoTracking();
      }, 100);
    } catch (error) {
      // If join room fail error will be shown here, display it to user
      // If user said no to camera permission this will be triggered
      this.errorMessages = error;
      console.log("Error joining room:", error);

      //Lets return to status 0 on error ? not sure can be based on conditions later
      this.status = 0;
    }
  }

  /**
   * Destroy the room and disconnect from remote host
   */
  leaveRoom() {
    this.webRtcService.leaveRoom();

    // Safely clear video sources with null checks
    if (this.localVideo?.nativeElement) {
      this.localVideo.nativeElement.srcObject = null;
    }
    if (this.remoteVideo?.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = null;
    }

    this.stopTimer();

    // Reset video status tracking
    this.hasLocalVideo = false;
    this.hasRemoteVideo = false;

    this.status = 3; // Change the status to disconnected
  }

  /**
   * Start the interview timer
   */
  startTimer() {
    this.interviewStartTime = new Date();
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  /**
   * Stop the interview timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Update the timer display
   */
  updateTimer() {
    if (!this.interviewStartTime) return;

    const now = new Date();
    const diff = now.getTime() - this.interviewStartTime.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.currentTime = `${this.padZero(hours)}:${this.padZero(
      minutes
    )}:${this.padZero(seconds)}`;

    // Update DOM element directly for better performance
    const timerElement = document.getElementById("timer");
    if (timerElement) {
      timerElement.textContent = this.currentTime;
    }
  }

  /**
   * Set up video status tracking for local and remote streams
   */
  private setupVideoTracking() {
    // Track local video status
    if (this.localVideo?.nativeElement) {
      const localVideoElement = this.localVideo.nativeElement;

      // Check if video has a source
      const checkLocalVideo = () => {
        this.hasLocalVideo = !!(
          localVideoElement.srcObject &&
          (localVideoElement.srcObject as MediaStream).getVideoTracks().length >
            0 &&
          (localVideoElement.srcObject as MediaStream).getVideoTracks()[0]
            .enabled
        );
      };

      // Initial check
      checkLocalVideo();

      // Monitor stream changes
      localVideoElement.addEventListener("loadedmetadata", checkLocalVideo);
      localVideoElement.addEventListener("emptied", () => {
        this.hasLocalVideo = false;
      });
    } else {
      console.warn("Local video element not available for tracking");
    }

    // Track remote video status
    if (this.remoteVideo?.nativeElement) {
      const remoteVideoElement = this.remoteVideo.nativeElement;

      // Check if video has a source
      const checkRemoteVideo = () => {
        this.hasRemoteVideo = !!(
          remoteVideoElement.srcObject &&
          (remoteVideoElement.srcObject as MediaStream).getVideoTracks()
            .length > 0 &&
          (remoteVideoElement.srcObject as MediaStream).getVideoTracks()[0]
            .enabled
        );
      };

      // Initial check
      checkRemoteVideo();

      // Monitor stream changes
      remoteVideoElement.addEventListener("loadedmetadata", checkRemoteVideo);
      remoteVideoElement.addEventListener("emptied", () => {
        this.hasRemoteVideo = false;
      });
    } else {
      console.warn("Remote video element not available for tracking");
    }
  }

  /**
   * Pad numbers with leading zero
   */
  private padZero(num: number): string {
    return num.toString().padStart(2, "0");
  }

  ngOnDestroy(): void {
    // When ever we leave the room page we disconnect
    this.leaveRoom();
  }
}
