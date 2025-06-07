import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { WebrtcService } from './services/webrtc.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room',
  imports: [CommonModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss'
})
export class RoomComponent implements OnDestroy  {
  
  // Use the webRTC service
  constructor(private webRtcService: WebrtcService) {}
  
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


  /**
   * Function called to join a room with spesfic ID (auto generated when match is found)
   */
  async joinRoom() {
    try {

      // Change status preparing camera and mic permissions
      this.status = 1;
      // Clear error messages
      this.errorMessages = "" 

      // Start video (will ask for permission for camera access)
      await this.webRtcService.joinRoom(
        "adel",
        this.localVideo.nativeElement,
        this.remoteVideo.nativeElement
      );

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
