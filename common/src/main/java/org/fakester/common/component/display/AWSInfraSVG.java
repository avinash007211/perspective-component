package org.fakester.common.component.display;

import java.util.List;

import org.fakester.common.RadComponents;

import com.inductiveautomation.ignition.common.gson.JsonObject;
import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import com.inductiveautomation.perspective.common.api.ComponentEventDescriptor;


public class AWSInfraSVG {
    public static final String COMPONENT_ID = "rad.display.AWSInfraSVG";

    public static JsonSchema SCHEMA;
    public static JsonSchema EVENT_SCHEMA;

    static {
        try {
            // Load component properties from JSON schema
            SCHEMA = JsonSchema.parse(RadComponents.class.getResourceAsStream("/AWSInfraSVG.props.json"));

            // Create event schema for room click
            JsonObject eventSchema = new JsonObject();
            JsonObject properties = new JsonObject();

            JsonObject roomId = new JsonObject();
            roomId.addProperty("type", "string");
            roomId.addProperty("description", "The ID of the clicked room");

            JsonObject tagValue = new JsonObject();
            tagValue.addProperty("type", "number");
            tagValue.addProperty("description", "Current value of the bound tag");

            properties.add("roomId", roomId);
            properties.add("tagValue", tagValue);

            eventSchema.add("properties", properties);
            EVENT_SCHEMA = new JsonSchema(eventSchema);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load schema", e);
        }
    }

    public static ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
        .setPaletteCategory(RadComponents.COMPONENT_CATEGORY)
        .setId(COMPONENT_ID)
        .setModuleId(RadComponents.MODULE_ID)
        .setSchema(SCHEMA)
        .setName("AWS Infra SVG")
        .setDefaultMetaName("awsInfraSVG")
        .addPaletteEntry(
            "", 
            "AWS Infra SVG", 
            "Interactive SVG component that responds to tag values and clicks", 
            null, 
            null
        )        
        .setEvents(List.of(
            new ComponentEventDescriptor("roomClick", "Fired when a room is clicked", EVENT_SCHEMA)
        ))
        .setResources(RadComponents.BROWSER_RESOURCES)
        .build();
}
