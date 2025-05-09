//Messenger.tsx
import * as React from "react";
import {
  AbstractUIElementStore,
  Component,
  ComponentMeta,
  ComponentProps,
  ComponentStoreDelegate,
  JsObject,
  makeLogger,
  PComponent,
  PropertyTree,
  SizeObject
} from "@inductiveautomation/perspective-client";
import { bind } from "bind-decorator";
import { ReactComponent as MessengerIcon } from "../../assets/messenger-icon.svg";

// Unique identifier for the component in Ignition Perspective
export const COMPONENT_TYPE = "rad.display.messenger";

// Property key for message configuration
export const MESSAGE_CONFIG_PROP = "messageConfig";

// Message mapping configuration, based on the number of messages
interface MessagePropConfig {
  [key: string]: string;
}

// Default configuration for mapping message count to display messages
export const DEFAULT_MESSAGE_CONFIG: MessagePropConfig = {
  "0": "None",
  "1": "Messages!",
  "5": "Lots of Messages!",
  "10": "Literally ten+ messages!",
  "25": "Carpal Tunnel Warning!"
};

// Logger instance for this component
const logger = makeLogger("radcomponents.Messenger");

// Internal state passed from delegate to component
interface MessengerDelegateState {
  messagePending: boolean;
  messageCount: number;
}

// Custom event names for communication with the Gateway
enum MessageEvents {
  MESSAGE_REQUEST_EVENT = "messenger-component-message-event",
  MESSAGE_RESPONSE_EVENT = "messenger-component-message-response-event"
}

// Delegate class for managing backend state and communication
export class MessageComponentGatewayDelegate extends ComponentStoreDelegate {
  private messagePending: boolean = false;
  private messageCount: number = 0;

  constructor(componentStore: AbstractUIElementStore) {
    super(componentStore);
  }

  // Map delegate state to component props
  mapStateToProps(): MessengerDelegateState {
    return {
      messageCount: this.messageCount,
      messagePending: this.messagePending
    };
  }

  // Fire an event to the backend with message payload
  public fireDelegateEvent(eventName: string, eventObject: JsObject): void {
    logger.info(() => `Firing ${eventName} event with message body ${JSON.stringify(eventObject)}`);
    this.fireEvent(eventName, eventObject);
    this.messagePending = true;
    this.notify();
  }

  // Shortcut for triggering a gateway message event
  public fireGatewayMessage(): void {
    this.fireDelegateEvent(MessageEvents.MESSAGE_REQUEST_EVENT, {
      count: this.messageCount
    });
  }

  // Handle incoming events from the backend
  handleEvent(eventName: string, eventObject: JsObject): void {
    logger.info(() => `Received '${eventName}' event!`);
    switch (eventName) {
      case MessageEvents.MESSAGE_RESPONSE_EVENT:
        this.handleComponentResponseEvent(eventObject);
        break;
      default:
        logger.warn(() => `No handler found for event: ${eventName}`);
    }
  }

  // Handle specific logic for message response events
  handleComponentResponseEvent(eventObject: JsObject): void {
    logger.info(() => `Handling message with contents: ${JSON.stringify(eventObject)}`);
    if (typeof eventObject.count === "number") {
      // Update only if changed or if previously pending
      if (this.messageCount !== eventObject.count || this.messagePending !== false) {
        this.messageCount = eventObject.count;
        this.messagePending = false;
        this.notify();
      }
    } else if (eventObject.error) {
      logger.error(() => `Error: ${eventObject.error}`);
    } else {
      logger.error(() => `No payload in response.`);
    }
  }
}

// Main React component that renders the Messenger UI
export class MessengerComponent extends Component<
  ComponentProps<MessagePropConfig, MessengerDelegateState>,
  {}
> {
  rootElementRef: Element | void;

  // Assigns reference to the DOM element after component mounts
  componentDidMount() {
    this.rootElementRef = this.props.store.element;
  }

  // Trigger a message send to the backend
  @bind
  fireUpdateToGateway(): void {
    logger.info(() => "Firing message to Gateway.");
    (this.props.store.delegate! as MessageComponentGatewayDelegate).fireGatewayMessage();
  }

  // Determine background color based on message count
  @bind
  getBackgroundColor(): string {
    const count = this.props.delegate!.messageCount;
    if (count >= 25) return "red";
    if (count >= 10) return "grey";
    if (count >= 5) return "green";
    if (count >= 1) return "yellow";
    return "white";
  }

  // Return display message based on the closest threshold below or equal to message count
  @bind
  renderMsg(): string {
    const count = this.props.delegate!.messageCount;

    const sorted = Object.entries(this.props.props.messageConfig)
      .filter(([k]) => /^[0-9]+$/.test(k)) // Only numeric keys
      .map(([k, v]) => [Number(k), v] as [number, string])
      .sort((a, b) => a[0] - b[0]);

    const match = sorted.reduce(
      (acc: [number, string], next: [number, string]) =>
        count >= next[0] ? next : acc,
      [-1, "Default Message!"] as [number, string]
    );

    return match[1];
  }

  // Render the SVG-based UI of the component
  render() {
    const { messagePending, messageCount } = this.props.delegate!;
    const displayMessage = this.renderMsg();
    const buttonText = messagePending ? "Waiting" : "Send";
    const countColor = messageCount === 10 ? "grey" : "black";
    const buttonFill = messagePending ? "#ccc" : "#007bff";

    return (
      <div
        ref={(el) => (this.rootElementRef = el!)}
        {...this.props.emit({ classes: ["messenger-component-wrapper"] })}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 120"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Component Background */}
          <rect
            x="0"
            y="0"
            width="200"
            height="120"
            rx="10"
            ry="10"
            fill={this.getBackgroundColor()}
          />

          {/* Messenger Icon */}
          <g transform="translate(10, 10)">
            <MessengerIcon width="30" height="30" />
          </g>

          {/* Message Count */}
          <text x="100" y="40" textAnchor="middle" fontSize="20" fill={countColor}>
            {messageCount}
          </text>

          {/* Message Description */}
          <text x="100" y="65" textAnchor="middle" fontSize="12" fill="#333">
            {displayMessage}
          </text>

          {/* Send Button */}
          <g
            onClick={this.fireUpdateToGateway}
            style={{ cursor: messagePending ? "not-allowed" : "pointer" }}
          >
            <rect x="60" y="80" width="80" height="30" rx="5" ry="5" fill={buttonFill} />
            <text
              x="100"
              y="100"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fill="white"
              pointerEvents="none"
            >
              {buttonText}
            </text>
          </g>
        </svg>
      </div>
    );
  }
}

// Component metadata definition used by Ignition's Perspective Designer
export class MessengerComponentMeta implements ComponentMeta {
  getComponentType(): string {
    return COMPONENT_TYPE;
  }

  // Define default size in the Perspective Designer
  getDefaultSize(): SizeObject {
    return {
      width: 120,
      height: 90
    };
  }

  // Creates the delegate that handles Gateway communication and state
  createDelegate(component: AbstractUIElementStore): ComponentStoreDelegate | undefined {
    return new MessageComponentGatewayDelegate(component);
  }

  // Returns the actual UI component to render
  getViewComponent(): PComponent {
    return MessengerComponent;
  }

  // Pulls configuration from Perspective props
  getPropsReducer(tree: PropertyTree): MessagePropConfig {
    return {
      messageConfig: tree.read("messageConfig", DEFAULT_MESSAGE_CONFIG)
    };
  }
}
