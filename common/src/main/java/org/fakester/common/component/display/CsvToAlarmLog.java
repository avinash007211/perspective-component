package org.fakester.common.component.display;

import org.fakester.common.RadComponents;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;

/**
 * Meta information about the CsvToAlarmLog component.  See {@link Image} for docs on each field.
 * 
 */
public class CsvToAlarmLog {
    public static String COMPONENT_ID = "rad.display.CsvToAlarmLog";

    public static JsonSchema SCHEMA =
        JsonSchema.parse(RadComponents.class.getResourceAsStream("/CsvToAlarmLog.props.json"));

    public static ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
        .setPaletteCategory(RadComponents.COMPONENT_CATEGORY + "-Buttons")
        .setId(COMPONENT_ID)
        .setModuleId(RadComponents.MODULE_ID)
        .setSchema(SCHEMA) //  this could alternatively be created purely in Java if desired
        .setName("CsvToAlarmLog")
        .addPaletteEntry("", "CsvToAlarmLog", "A component that converts CSV file to tags and it's associated Alarms.", null, null)
        .setDefaultMetaName("CsvToAlarmLog")
        .setResources(RadComponents.BROWSER_RESOURCES)
        .build();

}
