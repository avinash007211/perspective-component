import * as React from "react";
import {
  Component,
  ComponentMeta,
  PComponent,
  PropertyTree,
  SizeObject,
  ComponentProps,
} from "@inductiveautomation/perspective-client";
import "../../scss/_ScreenCapture.scss";
import { bind } from "bind-decorator";

// Component type identifier for registration
export const COMPONENT_TYPE = "rad.display.ScreenCapture";

// Props interface for configurable component properties
interface ScreenCaptureProps {
  buttonText: string;
  buttonColor: string;
  textColor: string;
  fontSize: string;
  screenshotButtonText: string;
  screenshotButtonColor: string;
  showConfirmation: boolean;
  confirmationMessage: string;
}

// Component state definition
interface ScreenCaptureState {
  recording: boolean;
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  isLoading: boolean;
  isSuccess: boolean | null;
  message: string;
}

// Main component class
export class ScreenCapture extends Component<ComponentProps<ScreenCaptureProps>, ScreenCaptureState> {
  private stream: MediaStream | null = null; // Media stream reference
  private downloadLink: HTMLAnchorElement | null = null; // Anchor used for downloading files

  constructor(props: ComponentProps<ScreenCaptureProps>) {
    super(props);
    // Initial state setup
    this.state = {
      recording: false,
      mediaRecorder: null,
      recordedChunks: [],
      isLoading: false,
      isSuccess: null,
      message: "",
    };
  }

  // Starts screen recording
  @bind
  private async startRecording() {
    // Optional user confirmation
    if (this.props.showConfirmation && !window.confirm(this.props.confirmationMessage)) {
      return;
    }

    this.setState({ isLoading: true, message: "Preparing recording..." });

    try {
      // Request screen media stream
      const mediaDevices = navigator.mediaDevices as any;
      this.stream = await mediaDevices.getDisplayMedia({ video: { displaySurface: "browser" } });

      if (!this.stream) {
        throw new Error("Failed to get media stream");
      }

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "video/webm;codecs=vp9"
      });

      // Handle data chunks
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.setState((prevState) => ({
            recordedChunks: [...prevState.recordedChunks, event.data],
          }));
        }
      };

      // Handle stop event
      mediaRecorder.onstop = () => {
        const blob = new Blob(this.state.recordedChunks, { type: "video/webm" });
        this.handleDownload(blob, "screen_recording.webm", "Recording saved successfully!");
      };

      // Start recording
      mediaRecorder.start(1000);
      this.setState({ 
        recording: true, 
        mediaRecorder,
        isLoading: false,
        message: "Recording in progress..."
      });
    } catch (error) {
      console.error("Error starting screen recording", error);
      this.setState({
        isLoading: false,
        isSuccess: false,
        message: "Error starting recording",
      });
      this.cleanupStream();
    }
  }

  // Handles blob download and email prompt
  @bind
  private handleDownload(blob: Blob, filename: string, successMessage: string) {
    const url = URL.createObjectURL(blob);
    this.downloadLink = document.createElement("a");
    this.downloadLink.href = url;
    this.downloadLink.download = filename;
    document.body.appendChild(this.downloadLink);

    // Compose and trigger email with file context
    const handleClick = () => {
      setTimeout(() => {
        this.setState({
          isSuccess: true,
          message: successMessage,
          recordedChunks: [],
        });

        const subject = encodeURIComponent("Screen Capture Submission - Please Review");
        const body = encodeURIComponent(`
Dear Team,

A screen capture (screenshot or screen recording) has been completed and is now available for your review.

File Name: ${filename}

The file has been saved locally. Please find it attached to this email or locate it in the default downloads folder if not yet attached. The capture was performed for documentation, troubleshooting, or quality assurance purposes.

Kindly review the attached media and take any necessary actions as per the standard operating procedure.

If you have any questions or require additional information, feel free to reach out.

Best regards,
[Your Name / Department]
        `);
        const recipient = "abc@example.com";
        window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, "_blank");

        this.downloadLink?.removeEventListener("click", handleClick);
      }, 100);
    };

    this.downloadLink.addEventListener("click", handleClick);
    this.downloadLink.click();

    // Cleanup link after use
    setTimeout(() => {
      if (this.downloadLink) {
        document.body.removeChild(this.downloadLink);
        URL.revokeObjectURL(url);
        this.downloadLink = null;
      }
    }, 10000);
  }

  // Stops the recording and cleans up
  @bind
  stopRecording() {
    if (this.state.mediaRecorder) {
      this.state.mediaRecorder.stop();
      this.setState({ recording: false, mediaRecorder: null });
    }
    this.cleanupStream();
  }

  // Captures a still screenshot using ImageCapture API
  @bind
  async takeScreenshot() {
    if (this.props.showConfirmation && !window.confirm(this.props.confirmationMessage)) {
      return;
    }

    this.setState({ isLoading: true, message: "Preparing screenshot..." });

    try {
      const mediaDevices = navigator.mediaDevices as any;
      const stream = await mediaDevices.getDisplayMedia({ video: { displaySurface: "browser" } });
      const track = stream.getVideoTracks()[0];

      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      track.stop();

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            this.handleDownload(blob, "screenshot.png", "Screenshot saved successfully!");
          }
        }, "image/png");
      }
    } catch (error) {
      console.error("Error taking screenshot", error);
      this.setState({
        isLoading: false,
        isSuccess: false,
        message: "Error capturing screenshot",
      });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // Stops all media tracks and clears stream
  cleanupStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  // Ensures cleanup on component unmount
  componentWillUnmount() {
    if (this.state.recording && this.state.mediaRecorder) {
      this.state.mediaRecorder.stop();
    }
    this.cleanupStream();
    if (this.downloadLink) {
      document.body.removeChild(this.downloadLink);
      this.downloadLink = null;
    }
  }

  // Renders the buttons and status message
  render() {
    const { 
      buttonText = "Start Recording",
      screenshotButtonText = "Take Screenshot",
      buttonColor = "#0078D4",
      textColor = "#FFFFFF",
      fontSize = "1rem",
      emit
    } = this.props;

    const { recording, isLoading } = this.state;

    return (
      <div {...emit({ classes: ['screen-capture-component'] })}>
        <div className="button-container">
          <button
            className="screen-capture-button screenshot-btn"
            onClick={this.takeScreenshot}
            disabled={isLoading}
            style={{
              backgroundColor: '#4CAF50',
              color: textColor,
              fontSize: fontSize
            }}
          >
            {isLoading ? 'Processing...' : screenshotButtonText}
          </button>

          <button
            className={`screen-capture-button ${recording ? 'recording-btn' : ''}`}
            onClick={recording ? this.stopRecording : this.startRecording}
            disabled={isLoading}
            style={{
              backgroundColor: recording ? '#F44336' : buttonColor,
              color: textColor,
              fontSize: fontSize
            }}
          >
            {isLoading ? 'Processing...' : (recording ? 'Stop Recording' : buttonText)}
          </button>
        </div>

        {this.state.message && (
          <div className={`message ${this.state.isSuccess ? 'success' : 'error'}`}>
            {this.state.message}
          </div>
        )}
      </div>
    );
  }
}

// Component metadata for Ignition Perspective Designer
export class ScreenCaptureMeta implements ComponentMeta {
  getComponentType(): string {
    return COMPONENT_TYPE;
  }

  getViewComponent(): PComponent {
    return ScreenCapture;
  }

  getDefaultSize(): SizeObject {
    return { width: 300, height: 120 };
  }

  // Maps Perspective property tree to component props
  getPropsReducer(tree: PropertyTree): ScreenCaptureProps {
    return {
      buttonText: tree.readString("buttonText", "Start Recording"),
      screenshotButtonText: tree.readString("screenshotButtonText", "Take Screenshot"),
      buttonColor: tree.readString("buttonColor", "#0078D4"),
      screenshotButtonColor: tree.readString("screenshotButtonColor", "#4CAF50"),
      textColor: tree.readString("textColor", "#FFFFFF"),
      fontSize: tree.readString("fontSize", "1rem"),
      showConfirmation: tree.readBoolean("showConfirmation", true),
      confirmationMessage: tree.readString("confirmationMessage", "Do you want to start screen capture?")
    };
  }
}
