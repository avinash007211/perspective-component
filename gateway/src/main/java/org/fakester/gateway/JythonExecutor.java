package org.fakester.gateway;


import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.inductiveautomation.ignition.common.browsing.BrowseFilter;
import com.inductiveautomation.ignition.common.gson.JsonElement;
import com.inductiveautomation.ignition.common.gson.JsonParser;
import com.inductiveautomation.ignition.common.model.values.BasicQualifiedValue;
import com.inductiveautomation.ignition.common.model.values.QualifiedValue;
import com.inductiveautomation.ignition.common.model.values.QualityCode;
import com.inductiveautomation.ignition.common.tags.browsing.NodeDescription;
import com.inductiveautomation.ignition.common.tags.config.CollisionPolicy;
import com.inductiveautomation.ignition.common.tags.model.SecurityContext;
import com.inductiveautomation.ignition.common.tags.model.TagPath;
import com.inductiveautomation.ignition.common.tags.paths.BasicTagPath;
import com.inductiveautomation.ignition.common.tags.paths.parser.TagPathParser;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;

public class JythonExecutor {

    private static final Logger logger = LoggerFactory.getLogger(JythonExecutor.class);
    private static GatewayContext context = null;
    
    public JythonExecutor(GatewayContext context) {
        JythonExecutor.context = context;
    }
    
    // Programs that writes value to a tag
    public boolean WriteToTag(String tagPathString, String newValue)
    {
        try{
            logger.info("Tag Path String : {} ", tagPathString);
            logger.info("Tag Path Value : {} ", newValue);
            var tagsManager = context.getTagManager().getTagProvider("default");

            // Security level manager and configs
            var securityManager = context.getSecurityLevelManager();
            var securityLevelConfig = securityManager.getSecurityLevelsConfig();
            SecurityContext securityContext = SecurityContext.fromSecurityLevels(securityLevelConfig);
            // Defining tag paths
            List<TagPath> tagPathsArray = new ArrayList<>();
            tagPathsArray.add(TagPathParser.parse(tagPathString));

            // defining write values
            BasicQualifiedValue basicQualifiedValueErste = new BasicQualifiedValue(Integer.parseInt(newValue));

            List<QualifiedValue> values = new ArrayList<>();
            values.add(basicQualifiedValueErste);

            tagsManager.writeAsync(tagPathsArray, values, securityContext);
        }
        catch (Exception exception)
        {
            logger.info("Writing to tag {} failed !", tagPathString);
            return false;
        }
        
        return true;
    }

    public String readTagValueX(String tagPathStr) {
        try {
            // Convert string path to a TagPath object
            BasicTagPath tagPath = new BasicTagPath(tagPathStr);

            var tagsManager = context.getTagManager().getTagProvider("default");

            // Security level manager and configs
            var securityManager = context.getSecurityLevelManager();
            var securityLevelConfig = securityManager.getSecurityLevelsConfig();
            //logger.info("Security level manager : "+securityManager.getSecurityLevelsConfig());

            // Read tag value
            var igg = tagPath.getParentPath();
            logger.info("igg : {}",igg);

            var jp = tagsManager.browseAsync(igg, new BrowseFilter());
            logger.info("JP : {}",jp);

            jp.thenAccept(results -> {
                        if (results != null) {
                            for (NodeDescription node : results.getResults()) { // Assuming `getItems()` returns an iterable list
                                System.out.println(node);
                                logger.info("Node : {}", node);
                                logger.info("Node : {}", node.getDataType());
                            }
                        } else {
                            System.out.println("No results found.");
                        }
                    });

            //SecurityContext securityContext = SecurityContext.fromAuthenticatedUser(authenticatedUser);
            SecurityContext securityContext = SecurityContext.fromSecurityLevels(securityLevelConfig);

            // Defining tag paths
            List<TagPath> tagPaths2 = new ArrayList<>();
            tagPaths2.add(TagPathParser.parse("[default]Simulation/Counter"));
            tagPaths2.add(TagPathParser.parse("[default]Simulation/Random"));

            // defining write values
            int erste = 70;
            int zweite = 7000;
            BasicQualifiedValue basicQualifiedValueErste = new BasicQualifiedValue(erste);
            BasicQualifiedValue basicQualifiedValueZweite = new BasicQualifiedValue(zweite);

            List<QualifiedValue> values = new ArrayList<>();
            values.add(basicQualifiedValueErste);
            values.add(basicQualifiedValueZweite);

            var qve = tagsManager.readAsync(tagPaths2, securityContext).get().get(0);
            var qvz = tagsManager.readAsync(tagPaths2, securityContext).get().get(1);
            logger.info("QV Erste : {}", qve);
            logger.info("QV Erste : {}", qvz);
            logger.info("QV Erste : {}", qve.getClass());
            logger.info("QV Erste : {}", qvz.getClass());

            var qce = tagsManager.writeAsync(tagPaths2, values, securityContext);
            logger.info("QC Erste : {}", qce);

            qve = tagsManager.readAsync(tagPaths2, securityContext).get().get(0);
            qvz = tagsManager.readAsync(tagPaths2, securityContext).get().get(1);
            logger.info("QV Zweite : {}", qve);
            logger.info("QV Zweite : {}", qvz);

            return  "Success";
        } catch (Exception e) {
            e.printStackTrace();
            return "Failed!";
        }
    }

    public String createTagValue(String tagPathStr)
    {
        // Creating TagPath and calling the TagProvider there
        BasicTagPath tagPath = new BasicTagPath("[default]");
        var tagsManager = context.getTagManager().getTagProvider("default");

        // Security level manager and configs
        var securityManager = context.getSecurityLevelManager();

        // Read tag value
        var igg = tagPath.getParentPath();

        // Import text, type and collision policy
        String importText =  "{\n" +
                "  \"tags\": [\n" +
                "    {\n" +
                "      \"name\": \"Tag12\",\n" +
                "      \"tagType\": \"AtomicTag\",\n" +
                "      \"valueSource\": \"opc\",\n" +
                "      \"opcItemPath\": \"ns=1;s=[Sample_Device][Controls]/baseRateNode\",\n" +
                "      \"alarms\": [\n" +
                "        {\n" +
                "          \"name\": \"Alarm\",\n" +
                "          \"label\": \"asd\",\n" +
                "          \"priority\": \"High\",\n" +
                "          \"displayPath\": \"\",\n" +
                "          \"ackNotesReqd\": true\n" +
                "        }\n" +
                "      ],\n" +
                "      \"opcServer\": \"Ignition OPC UA Server\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"name\": \"HelloTag\",\n" +
                "      \"tagType\": \"AtomicTag\",\n" +
                "      \"valueSource\": \"memory\",\n" +
                "      \"readOnly\": false,\n" +
                "      \"writePermissions\": {\n" +
                "        \"type\": \"AnyOf\",\n" +
                "        \"securityLevels\": []\n" +
                "      },\n" +
                "      \"alarms\": [\n" +
                "        {\n" +
                "          \"name\": \"Alarm\",\n" +
                "          \"label\": \"\"\n" +
                "        }\n" +
                "      ],\n" +
                "      \"readPermissions\": {\n" +
                "        \"type\": \"AnyOf\",\n" +
                "        \"securityLevels\": []\n" +
                "      },\n" +
                "      \"value\": 4560\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        String importJsonString = tagPathStr;
        
        String importType = "json";
        var collisionPolicy = CollisionPolicy.Overwrite;

        JsonElement element = new JsonParser().parse(importJsonString); // this is a JsonPrimitive (string)
        String innerJson = element.getAsString();

        logger.info("Importing tag XX");
        // Calling the function
        var futureResult = tagsManager.importTagsAsync(igg, innerJson, importType, collisionPolicy);
        logger.info("Importing tag XX completed! {}", futureResult);

        futureResult.thenAccept(qualityCodes -> {
            for (QualityCode code : qualityCodes) {
                System.out.println("Import Result: " + code);
                logger.info("Import Result : {}", code);
            }
        }).exceptionally(ex -> {
            System.err.println("Import failed: " + ex.getMessage());
            logger.info("Import Failed : {}",ex.getMessage());
            return null;
        });

        return "success";
    }
}