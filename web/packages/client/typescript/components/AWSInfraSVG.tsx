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
  { id: "A1.1", x: 60, y: 100, width: 200, height: 120 },
  { id: "A1.2", x: 200, y: 100, width: 200, height: 120 },
  { id: "A1.3", x: 340, y: 100, width: 200, height: 120 },
  { id: "A1.4", x: 480, y: 100, width: 200, height: 120 },
  { id: "A1.5", x: 620, y: 100, width: 200, height: 120 },
  { id: "A1.6", x: 760, y: 100, width: 200, height: 120 }
];

interface AWSInfraDelegateState {
  selectedRoom: string;
}

export class AWSInfraDelegate extends ComponentStoreDelegate {
  private selectedRoom: string = "";

  constructor(componentStore: AbstractUIElementStore) {
    super(componentStore);
  }

  mapStateToProps(): AWSInfraDelegateState {
    return { selectedRoom: this.selectedRoom };
  }

  handleEvent(eventName: string, eventObject: JsObject): void {
    logger.info(() => `Received '${eventName}' event!`);
    if (eventName === "aws-server-selected") {
      this.selectedRoom = eventObject.selectedRoom;
      this.notify();
    }
  }
}

export class AWSInfraSVGComponent extends Component<
  ComponentProps<{ selectedRoom: string }>,
  {}
> {
  rootElementRef: Element | void;

  constructor(props: ComponentProps<{ selectedRoom: string }>) {
    super(props);
    this.handleRoomClick = this.handleRoomClick.bind(this);
  }

  componentDidMount() {
    this.rootElementRef = this.props.store.element;
  }

  handleRoomClick(roomId: string): void {
    const currentSelection = this.props.delegate?.selectedRoom;
    const newSelection = currentSelection === roomId ? "" : roomId;
    this.props.store.delegate?.handleEvent("aws-server-selected", { selectedRoom: newSelection });
  }

  render() {
    const { selectedRoom } = this.props.delegate!;

    return (
      <div
        ref={(el) => (this.rootElementRef = el!)}
        className="aws-infra-svg-component-wrapper"
        style={{ width: "100%", height: "100%", position: "relative" }}
        {...this.props.emit()}
      >
        <svg
          viewBox="0 0 821 230"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
        >
          {/* Background */}
          <rect x="0" y="0" width="821" height="230" fill="#f5f5f5" rx="8" ry="8" className="background-rect" />

          {/* Server Boxes */}
          {SERVER_ROOMS.map((room) => {
            const isSelected = room.id === selectedRoom;
            return (
              <React.Fragment key={room.id}>
                <rect
                  x={room.x - room.width / 2}
                  y={room.y - room.height / 2}
                  width={room.width}
                  height={room.height}
                  rx="5"
                  ry="5"
                  fill={isSelected ? "#00b300" : "white"}
                  stroke={isSelected ? "black" : "#999"}
                  strokeWidth={isSelected ? 2 : 1}
                  onClick={() => this.handleRoomClick(room.id)}
                  transform={`rotate(-90 ${room.x} ${room.y})`}
                  className={isSelected ? "selected-room-box" : "room-box"}
                />

                {/* Only show ID text when selected */}
                {isSelected && (
                  <text
                    x={room.x}
                    y={room.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight="bold"
                    fontSize="14"
                    fill="white"
                    className="server-id-text"
                  >
                    {room.id}
                  </text>
                )}
              </React.Fragment>
            );
          })}

          {/* Labels above each box (always visible) */}
          {SERVER_ROOMS.map((room) => (
            <text
              key={`label-${room.id}`}
              x={room.x}
              y={room.y - room.height / 2 - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
              className="room-label"
            >
              {room.id.replace("A1.", "Server-")}
            </text>
          ))}

          {/* Selected Room Text */}
          {selectedRoom && (
            <text
              x="410"
              y="215"
              textAnchor="middle"
              fontSize="14"
              fill="#333"
              fontWeight="bold"
              className="selected-room-indicator"
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
    return {
      width: 821,
      height: 230
    };
  }

  getMinSize(): SizeObject {
    return {
      width: 400,
      height: 115
    };
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