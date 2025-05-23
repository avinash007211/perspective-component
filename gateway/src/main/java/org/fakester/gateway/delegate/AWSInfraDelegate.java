package org.fakester.gateway.delegate;

import java.util.Arrays;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.fakester.gateway.RadGatewayHook;
import org.python.core.Py;
import org.python.core.PyObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.inductiveautomation.ignition.common.gson.JsonElement;
import com.inductiveautomation.ignition.common.gson.JsonObject;
import com.inductiveautomation.ignition.common.script.builtin.KeywordArgs;
import com.inductiveautomation.ignition.common.script.builtin.PyArgumentMap;
import com.inductiveautomation.perspective.gateway.api.Component;
import com.inductiveautomation.perspective.gateway.api.ComponentModelDelegate;
import com.inductiveautomation.perspective.gateway.api.ScriptCallable;
import com.inductiveautomation.perspective.gateway.messages.EventFiredMsg;

/**
 * Model Delegate for the Messenger component.
 */
public class AWSInfraDelegate extends ComponentModelDelegate {
    public static final String INCOMING_EVENT_NAME = "messenger-component-message-event";
    public static final String OUTBOUND_EVENT_NAME = "messenger-component-message-response-event";
    
    public static final String INCOMING_EVENT_TAG_VALUE_RECEIVE = "aws-component-message-receive-event";
    public static final String OUTBOUND_EVENT_TAG_VALUE_SEND = "aws-component-message-send-event";

    private final Logger logger = LoggerFactory.getLogger(getClass());

    public AWSInfraDelegate(Component component) {
        super(component);
    }

    @Override
    protected void onStartup() {
        // Called when the Gateway's ComponentModel starts.  The start itself happens when the client project is
        // loading and includes an instance of the the component type in the page/view being started.
        log.infof("Starting up delegate for '%s'!", component.getComponentAddressPath());
    }

    @Override
    protected void onShutdown() {
        // Called when the component is removed from the page/view and the model is shutting down.
        log.infof("Shutting down delegate for '%s'!", component.getComponentAddressPath());
    }

    /**
     * Use the {@link ScriptCallable} annotation to mark a public method accessible to script authors interacting
     * with your component on the backend.
     *
     * Use of {@link PyArgumentMap} and the {@code (PyObject[], String[])} signature is optional, but encouraged, as
     * it allows script authors to use keyword arguments when using your methods.
     *
     * @param pyArgs The PyObjects supplied by the script author
     * @param keywords Any keywords supplied by the script author.
     */
    @ScriptCallable
    @KeywordArgs(names = {"objects", "sep", "end"}, types = {String.class, String.class, String.class})
    public void print(PyObject[] pyArgs, String[] keywords) {
        PyArgumentMap argumentMap =
            PyArgumentMap.interpretPyArgs(pyArgs, keywords, MessageComponentModelDelegate.class, "print");
        String[] objects = argumentMap.getStringArray("objects", new String[0]);

        if (objects == null) {
            throw Py.ValueError("print argument 'objects' cannot be None");
        }

        log.info(Arrays.stream(objects)
            .collect(Collectors.joining(
                argumentMap.getIfString("sep").orElse(" "),
                "",
                argumentMap.getIfString("end").orElse("\n")
            )));
    }

    // when a ComponentStoreDelegate event is fired from the client side, it comes through this method.
    @Override
    public void handleEvent(EventFiredMsg message) {
        log.infof("Received EventFiredMessage of type: %s", message.getEventName());

        if (INCOMING_EVENT_TAG_VALUE_RECEIVE.equals(message.getEventName())) {
            JsonObject payload = message.getEvent();
            JsonObject responsePayload = new JsonObject();

            if (payload != null) {
                String[] tagKeys = {"counterTagPath", "randomTagPath"};
                String[] responseKeys = {"counterValue", "randomValue"};

                for (int i = 0; i < tagKeys.length; i++) {
                    JsonElement tagPathElement = payload.get(tagKeys[i]);

                    if (tagPathElement != null && tagPathElement.isJsonPrimitive() && tagPathElement.getAsJsonPrimitive().isString()) {
                        String tagPath = tagPathElement.getAsJsonPrimitive().getAsString();

                        try {
                            String value = RadGatewayHook.jythonExecutor.readTagFromPath(tagPath);
                            responsePayload.addProperty(responseKeys[i], value);
                        } catch (InterruptedException | ExecutionException e) {
                            responsePayload.addProperty("error_" + responseKeys[i], "Error reading tag: " + tagPath);
                        }
                    } else {
                        responsePayload.addProperty("error_" + responseKeys[i], "Missing or invalid tag path for " + tagKeys[i]);
                    }
                }
            } else {
                responsePayload.addProperty("error", "Gateway didn't receive a payload with '" + INCOMING_EVENT_NAME + "' event!");
            }

            fireEvent(OUTBOUND_EVENT_TAG_VALUE_SEND, responsePayload);
        }
    }


    // not necessary to override for our use case, just here for informational purposes
    @Override
    public void fireEvent(String eventName, JsonObject event) {
        this.component.fireEvent("model", eventName, event);
    }
}
