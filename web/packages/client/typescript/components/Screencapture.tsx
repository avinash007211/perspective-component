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

export const COMPONENT_TYPE = "rad.display.ScreenCapture";

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

interface ScreenCaptureState {
  recording: boolean;
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  isLoading: boolean;
  isSuccess: boolean | null;
  message: string;
}

export class ScreenCapture extends Component<ComponentProps<ScreenCaptureProps>, ScreenCaptureState> {
  private stream: MediaStream | null = null;
  private downloadLink: HTMLAnchorElement | null = null;

  constructor(props: ComponentProps<ScreenCaptureProps>) {
    super(props);
    this.state = {
      recording: false,
      mediaRecorder: null,
      recordedChunks: [],
      isLoading: false,
      isSuccess: null,
      message: "",
    };
  }

  @bind
  private async startRecording() {
    if (this.props.showConfirmation && !window.confirm(this.props.confirmationMessage)) {
      return;
    }

    this.setState({ isLoading: true, message: "Preparing recording..." });

    try {
      const mediaDevices = navigator.mediaDevices as any;
      this.stream = await mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "browser" }
      });

      if (!this.stream) {
        throw new Error("Failed to get media stream");
      }

      const mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "video/webm;codecs=vp9"
      });

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.setState((prevState) => ({
            recordedChunks: [...prevState.recordedChunks, event.data],
          }));
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(this.state.recordedChunks, { type: "video/webm" });
        this.handleDownload(blob, "screen_recording.webm", "Recording saved successfully!");
      };

      mediaRecorder.start(1000); // Collect data every second
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

  @bind
  private handleDownload(blob: Blob, filename: string, successMessage: string) {
    const url = URL.createObjectURL(blob);
    this.downloadLink = document.createElement("a");
    this.downloadLink.href = url;
    this.downloadLink.download = filename;
    document.body.appendChild(this.downloadLink);

    // Detect when user actually saves the file
    const handleClick = () => {
      setTimeout(() => {
        this.setState({
          isSuccess: true,
          message: successMessage,
          recordedChunks: [],
        });
        this.downloadLink?.removeEventListener('click', handleClick);
      }, 100);
    };

    this.downloadLink.addEventListener('click', handleClick);
    this.downloadLink.click();

    // Clean up after 10 seconds
    setTimeout(() => {
      if (this.downloadLink) {
        document.body.removeChild(this.downloadLink);
        URL.revokeObjectURL(url);
        this.downloadLink = null;
      }
    }, 10000);
  }

  @bind
  stopRecording() {
    if (this.state.mediaRecorder) {
      this.state.mediaRecorder.stop();
      this.setState({ recording: false, mediaRecorder: null });
    }
    this.cleanupStream();
  }

  @bind
  async takeScreenshot() {
    if (this.props.showConfirmation && !window.confirm(this.props.confirmationMessage)) {
      return;
    }

    this.setState({ isLoading: true, message: "Preparing screenshot..." });

    try {
      const mediaDevices = navigator.mediaDevices as any;
      const stream = await mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "browser" }
      });
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

  cleanupStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

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