// React and Perspective imports
import * as React from "react";
import {
  Component,
  ComponentMeta,
  ComponentProps,
  PComponent,
  PropertyTree,
  SizeObject,
  makeLogger
} from "@inductiveautomation/perspective-client";
import "../../scss/_CsvToAlarmLog.scss";
import { bind } from 'bind-decorator';

export const COMPONENT_TYPE = "rad.display.CsvToAlarmLog";

// Component property interface defined for Perspective Designer bindings
interface CsvToAlarmLogProps {
  buttonText: string;
  buttonColor: string;
  textColor: string;
  fontSize: string;
  successMessage: string;
  errorMessage: string;
  warningMessage: string;
  showConfirmation: boolean;
  confirmationMessage: string;
}

// Component state interface
interface CsvToAlarmLogState {
  isLoading: boolean;
  isSuccess: boolean | null;
  message: string;
  convertedData: string | null;
  fileName: string | null;
}

// Logger for developer debugging
const logger = makeLogger("radcomponents.CsvToAlarmLog");

// Main component class
export class CsvToAlarmLog extends Component<ComponentProps<CsvToAlarmLogProps>, CsvToAlarmLogState> {
  // Initial state
  state: CsvToAlarmLogState = {
    isLoading: false,
    isSuccess: null,
    message: "",
    convertedData: null,
    fileName: null
  };

  // Handler for file input change
  @bind
  private handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ["csv", "xml", "json"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    
    // Validate file extension
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      this.setState({ 
        isSuccess: false, 
        message: this.props.warningMessage 
      });
      return;
    }

    // Remove extension from filename and trigger processing
    this.setState({ fileName: file.name.replace(/\.[^/.]+$/, "") });
    this.processFile(file, fileExtension);
  }

  // Reads file and triggers parsing logic based on extension
  private processFile(file: File, extension: string) {
    this.setState({ 
      isLoading: true, 
      message: "Processing file...",
      fileName: file.name.replace(/\.[^/.]+$/, "")
    });

    const reader = new FileReader();

    // File read success callback
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let jsonData;

        // Convert based on file type
        switch (extension) {
          case "csv":
            jsonData = this.convertCsvToJson(content);
            break;
          case "xml":
            jsonData = this.convertXmlToJson(content);
            break;
          case "json":
            jsonData = JSON.parse(content);
            break;
          default:
            throw new Error("Unsupported file type");
        }

        // Update state with parsed data
        this.setState({
          isLoading: false,
          isSuccess: true,
          message: this.props.successMessage,
          convertedData: JSON.stringify(jsonData, null, 2)
        });

        logger.info("File processed successfully");

      } catch (error) {
        this.setState({
          isLoading: false,
          isSuccess: false,
          message: `${this.props.errorMessage} ${error instanceof Error ? error.message : ""}`
        });
        logger.error("Error processing file");
      }
    };

    // Handle file read error
    reader.onerror = () => {
      this.setState({ 
        isLoading: false, 
        isSuccess: false, 
        message: this.props.errorMessage
      });
      logger.error("Error reading file");
    };

    reader.readAsText(file);
  }

  // Converts XML string to structured JSON object
  private convertXmlToJson(xmlText: string): any {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const tags = Array.from(xmlDoc.getElementsByTagName("Tag")).map(tagNode => {
      const tag: any = {
        name: tagNode.getAttribute("name"),
        tagType: tagNode.getAttribute("type") || "AtomicTag"
      };

      // Parse tag children: Properties and Alarms
      Array.from(tagNode.children).forEach(child => {
        if (child.nodeName === "Property") {
          const propName = child.getAttribute("name");
          if (propName) {
            try {
              tag[propName] = JSON.parse(child.textContent || '');
            } catch {
              tag[propName] = child.textContent;
            }
          }
        } else if (child.nodeName === "CompoundProperty" && child.getAttribute("name") === "alarms") {
          tag.alarms = Array.from(child.getElementsByTagName("PropertySet")).map(alarmNode => {
            const alarm: any = {};
            Array.from(alarmNode.getElementsByTagName("Property")).forEach(propNode => {
              const propName = propNode.getAttribute("name");
              if (propName) {
                try {
                  alarm[propName] = JSON.parse(propNode.textContent || '');
                } catch {
                  alarm[propName] = propNode.textContent;
                }
              }
            });

            // Normalize priority
            if (alarm.priority === "3" || alarm.priority === 3) {
              alarm.priority = "High";
            }
            return alarm;
          });
        }
      });

      // Default value source fallback
      if (!tag.valueSource) {
        tag.valueSource = tag.opcItemPath ? "opc" : "memory";
      }

      return tag;
    });

    return { tags };
  }

  // Button click handler for triggering file input (with optional confirmation)
  @bind
  private handleButtonClick() {
    if (this.props.showConfirmation && !window.confirm(this.props.confirmationMessage)) {
      return;
    }
    document.getElementById("csv-file-input")?.click();
  }

  // Converts CSV string to structured JSON
  private convertCsvToJson(csvText: string): any {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());

    const tags = lines.slice(1).map(line => {
      const values = line.split(',');
      const tag: any = {};
      const alarms: any[] = [];

      // Map headers to tag properties
      headers.forEach((header, index) => {
        if (values[index] && values[index].trim() !== '') {
          const value = values[index].trim();
          const cleanHeader = header.replace(/^tags\//, '');

          // Handle alarm properties
          if (cleanHeader.startsWith('alarms/0/')) {
            const alarmProp = cleanHeader.replace('alarms/0/', '');
            if (alarms.length === 0) alarms.push({});
            try {
              alarms[0][alarmProp] = value === 'TRUE' ? true :
                                     value === 'FALSE' ? false :
                                     JSON.parse(value);
            } catch {
              alarms[0][alarmProp] = value;
            }
            return;
          }

          // Handle nested permission structures
          if (cleanHeader.startsWith('writePermissions/') || cleanHeader.startsWith('readPermissions/')) {
            const [baseProp, nestedProp] = cleanHeader.split('/');
            if (!tag[baseProp]) {
              tag[baseProp] = { securityLevels: [] };
            }
            if (nestedProp === 'type') {
              tag[baseProp].type = value;
            }
            return;
          }

          // Handle all other properties
          try {
            tag[cleanHeader] = value === 'TRUE' ? true :
                              value === 'FALSE' ? false :
                              JSON.parse(value);
          } catch {
            tag[cleanHeader] = value;
          }
        }
      });

      // Attach alarms if present
      if (alarms.length > 0) {
        tag.alarms = alarms;
        if (!tag.alarms[0].displayPath) tag.alarms[0].displayPath = "";
        if (tag.alarms[0].priority === '3') tag.alarms[0].priority = "High";
      }

      // Defaults for missing tag fields
      if (!tag.tagType) tag.tagType = "AtomicTag";
      if (!tag.valueSource) tag.valueSource = tag.opcItemPath ? "opc" : "memory";

      return tag;
    });

    return {
      tags: tags.filter(tag => tag.name)
    };
  }

  // Trigger download of converted JSON
  @bind
  private handleDownload() {
    if (!this.state.convertedData) return;

    const blob = new Blob([this.state.convertedData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.state.fileName || "tags"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Main render method
  render() {
    const { 
      props: { buttonText, buttonColor, textColor, fontSize },
      emit
    } = this.props;

    const { isLoading, isSuccess, message, convertedData } = this.state;

    const buttonStyle = {
      backgroundColor: buttonColor,
      color: textColor,
      fontSize: fontSize,
      marginBottom: '12px'
    };

    const downloadButtonStyle = {
      ...buttonStyle,
      marginTop: '12px'
    };

    return (
      <div {...emit({ classes: ['csv-to-alarm-log-component'] })}>
        {/* Hidden file input */}
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,.xml,.json"
          style={{ display: "none" }}
          onChange={this.handleFileSelect}
        />

        {/* File select button */}
        <div className="button-container">
          <button
            className={`csv-to-alarm-button ${isLoading ? 'loading' : ''}`}
            onClick={this.handleButtonClick}
            disabled={isLoading}
            style={buttonStyle}
          >
            {isLoading ? 'Processing...' : buttonText}
          </button>
        </div>

        {/* Message display */}
        {message && (
          <div className={`message ${isSuccess ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Converted JSON preview and download */}
        {convertedData && isSuccess && (
          <div className="conversion-result">
            <div className="download-button-container">
              <button 
                onClick={this.handleDownload}
                style={downloadButtonStyle}
                className="download-button"
              >
                Download Converted JSON
              </button>
            </div>
            <pre className="json-preview">
              {convertedData}
            </pre>
          </div>
        )}
      </div>
    );
  }
}

// Metadata class for Perspective integration
export class CsvToAlarmLogMeta implements ComponentMeta {
  getComponentType(): string {
    return COMPONENT_TYPE;
  }

  getViewComponent(): PComponent {
    return CsvToAlarmLog;
  }

  getDefaultSize(): SizeObject {
    return { width: 200, height: 60 };
  }

  // Bind component props to Perspective properties
  getPropsReducer(tree: PropertyTree): CsvToAlarmLogProps {
    return {
      buttonText: tree.readString("buttonText", "Select File"),
      buttonColor: tree.readString("buttonColor", "#0078D4"),
      textColor: tree.readString("textColor", "#FFFFFF"),
      fontSize: tree.readString("fontSize", "1rem"),
      successMessage: tree.readString("successMessage", "File converted successfully!"),
      errorMessage: tree.readString("errorMessage", "Error converting file!"),
      warningMessage: tree.readString("warningMessage", "Invalid file type selected. Please choose a valid CSV, XML, or JSON file."),
      showConfirmation: tree.readBoolean("showConfirmation", true),
      confirmationMessage: tree.readString("confirmationMessage","Do you want to import Tags or Alarms list file?")
    };
  }
}
