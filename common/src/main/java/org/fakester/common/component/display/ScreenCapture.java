package org.fakester.common.component.display;

import org.fakester.common.RadComponents;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;

/**
 * Meta information about the CsvToAlarmLog component.  See {@link Image} for docs on each field.
 * 
 */
public class ScreenCapture {
    public static String COMPONENT_ID = "rad.display.ScreenCapture";

    public static JsonSchema SCHEMA =
        JsonSchema.parse(RadComponents.class.getResourceAsStream("/ScreenCapture.props.json"));

    public static ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
        .setPaletteCategory(RadComponents.COMPONENT_CATEGORY)
        .setId(COMPONENT_ID)
        .setModuleId(RadComponents.MODULE_ID)
        .setSchema(SCHEMA) //  this could alternatively be created purely in Java if desired
        .setName("ScreenCapture")
        .addPaletteEntry("", "ScreenCapture", "A prespective component that takes screenshot or record the Ignition window.", null, null)
        .setDefaultMetaName("ScreenCapture")
        .setResources(RadComponents.BROWSER_RESOURCES)
        .build();

}

