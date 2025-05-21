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

const logger = makeLogger("awsinfra.AWSInfraSVG");
export const COMPONENT_TYPE = "rad.display.AWSInfraSVG";

export const SERVER_ROOMS = [
  { id: "A1.1", x: 60, y: 100, width: 200, height: 120, tagPath: "[default]Simulation/Counter" },
  { id: "A1.2", x: 200, y: 100, width: 200, height: 120, tagPath: "[default]Simulation/Random" },
  { id: "A1.3", x: 340, y: 100, width: 200, height: 120, tagPath: "" },
  { id: "A1.4", x: 480, y: 100, width: 200, height: 120, tagPath: "" },
  { id: "A1.5", x: 620, y: 100, width: 200, height: 120, tagPath: "" },
  { id: "A1.6", x: 760, y: 100, width: 200, height: 120, tagPath: "" }
];

enum MessageEvents {
  AWS_REQUEST_EVENT = "aws-component-message-send-event",
  AWS_RESPONSE_EVENT = "aws-component-message-receive-event"
}

interface AWSInfraDelegateState {
  selectedRoom: string;
  randomTagValue: number;
  counterTagValue: number;
}

export class AWSInfraDelegate extends ComponentStoreDelegate {
  private selectedRoom: string = "";
  private randomTagValue: number = 0;
  private counterTagValue: number = 0;

  constructor(componentStore: AbstractUIElementStore) {
    super(componentStore);
  }

  mapStateToProps(): AWSInfraDelegateState {
    return {
      selectedRoom: this.selectedRoom,
      randomTagValue: this.randomTagValue,
      counterTagValue: this.counterTagValue
    };
  }

  public fireDelegateEvent(eventName: string, eventObject: JsObject): void {
    logger.info(() => `Firing ${eventName} event with message body ${JSON.stringify(eventObject, null, 2)}`);
    this.fireEvent(eventName, eventObject);
    this.notify();
  }

  public fireGatewayMessageWithTwoParameters(counterTagPathSend: string, randomTagPathSend: string): void {
    this.fireDelegateEvent(MessageEvents.AWS_RESPONSE_EVENT, {
      counterTagPath: counterTagPathSend,
      randomTagPath: randomTagPathSend
    });
  }

  handleEvent(eventName: string, eventObject: JsObject): void {
    logger.info(() => `Received '${eventName}' event!`);
    if (eventName === "aws-server-selected") {
      this.selectedRoom = eventObject.selectedRoom;
      this.notify();
    }

    if (eventName === MessageEvents.AWS_REQUEST_EVENT) {
      this.handleComponentResponseEvent(eventObject);
    }
  }

  handleComponentResponseEvent(eventObject: JsObject): void {
    logger.info(() => `Callback handling message with contents: ${JSON.stringify(eventObject)}`);

    const counterValRaw = eventObject.counterValue;
    const randomValRaw = eventObject.randomValue;

    if (counterValRaw && typeof counterValRaw === "string") {
      const match = counterValRaw.match(/\[(\d+(?:\.\d+)?),/);
      if (match && match[1]) {
        this.counterTagValue = Number(match[1]);
        logger.info(() => `Parsed counterTagValue: ${this.counterTagValue}`);
      }
    }

    if (randomValRaw && typeof randomValRaw === "string") {
      const match = randomValRaw.match(/\[(\d+(?:\.\d+)?),/);
      if (match && match[1]) {
        this.randomTagValue = Number(match[1]);
        logger.info(() => `Parsed randomTagValue: ${this.randomTagValue}`);
      }
    }

    this.notify();
  }
}

export class AWSInfraSVGComponent extends Component<ComponentProps<{ selectedRoom: string }>, {}> {
  private pollingInterval: NodeJS.Timer | null = null;
  rootElementRef: Element | void;

  componentDidMount() {
    this.rootElementRef = this.props.store.element;
    this.pollingInterval = setInterval(() => {
      this.fireUpdateToGatewayWithTwoParameters();
    }, 1000);
  }

  componentWillUnmount() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  fireUpdateToGatewayWithTwoParameters(): void {
    const counterTagPath = "[default]Simulation/Counter";
    const randomTagPath = "[default]Simulation/Random";
    (this.props.store.delegate! as AWSInfraDelegate).fireGatewayMessageWithTwoParameters(counterTagPath, randomTagPath);
  }

  handleRoomClick(roomId: string): void {    
    const currentSelection = this.props.delegate?.selectedRoom;
    const newSelection = currentSelection === roomId ? "" : roomId;
    this.props.store.delegate?.handleEvent("aws-server-selected", { selectedRoom: newSelection });
  }

  render() {
    const { selectedRoom, counterTagValue, randomTagValue } = this.props.delegate!;

    return (
      <div
        ref={(el) => (this.rootElementRef = el!)}
        className="aws-infra-svg-component-wrapper"
        style={{ width: "100%", height: "100%", position: "relative" }}
        {...this.props.emit()}
      >
        <svg viewBox="0 0 821 230" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <rect x="0" y="0" width="821" height="230" fill="#f5f5f5" rx="8" ry="8" />

          {SERVER_ROOMS.map((room) => {
            const isSelected = room.id === selectedRoom;
            const isA11 = room.id === "A1.1";
            const isA12 = room.id === "A1.2";

            const fillColor = isA11
              ? counterTagValue > 50 ? "#00b300" : "white"
              : isSelected ? "#00b300" : "white";            

            return (
              <React.Fragment key={room.id}>
                <rect
                  x={room.x - room.width / 2}
                  y={room.y - room.height / 2}
                  width={room.width}
                  height={room.height}
                  rx="5"
                  ry="5"
                  fill={fillColor}
                  stroke={isSelected ? "black" : "#999"}
                  strokeWidth={isSelected ? 2 : 1}
                  onClick={() => this.handleRoomClick(room.id)}
                  transform={`rotate(-90 ${room.x} ${room.y})`}
                />

                {/* Only show box ID when selected */}
                {isSelected && (
                  <text
                    x={room.x}
                    y={room.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight="bold"
                    fontSize="14"
                    fill={isA11 ? "black" : "white"} // A1.1 ID in black, others in white
                    className="server-id-text"
                  >
                    {room.id}
                  </text>
                )}

                {/* Tag values always visible for A1.1 and A1.2 */}
                {isA11 && (
                  <text x={room.x} y={room.y + 20} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">
                    {counterTagValue}
                  </text>
                )}
                {isA12 && (
                  <text x={room.x} y={room.y + 20} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">
                    {randomTagValue}
                  </text>
                )}
              </React.Fragment>
            );
          })}

          {/* Static labels above all rooms */}
          {SERVER_ROOMS.map((room) => (
            <text
              key={`label-${room.id}`}
              x={room.x}
              y={room.y - room.height / 2 - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
            >
              {room.id.replace("A1.", "Server-")}
            </text>
          ))}

          {/* Selected Room Indicator */}
          {selectedRoom && (
            <text
              x="410"
              y="215"
              textAnchor="middle"
              fontSize="14"
              fill="#333"
              fontWeight="bold"
            >
              Selected Room: {selectedRoom}
            </text>
          )}
        </svg>
      </div>
    );
  }
}

export class AWSInfraSVGComponentMeta implements ComponentMeta {
  getComponentType(): string {
    return COMPONENT_TYPE;
  }

  getDefaultSize(): SizeObject {
    return { width: 821, height: 230 };
  }

  getMinSize(): SizeObject {
    return { width: 400, height: 115 };
  }

  createDelegate(component: AbstractUIElementStore): ComponentStoreDelegate | undefined {
    return new AWSInfraDelegate(component);
  }

  getViewComponent(): PComponent {
    return AWSInfraSVGComponent;
  }

  getPropsReducer(tree: PropertyTree): { selectedRoom: string } {
    return {
      selectedRoom: tree.read("selectedRoom", "")
    };
  }
}
