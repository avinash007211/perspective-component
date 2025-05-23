package org.fakester.gateway;

import java.io.IOException;
import java.util.Optional;

import com.inductiveautomation.ignition.common.logging.Level;
import org.fakester.common.RadComponents;
import org.fakester.common.component.display.AWSInfraSVG;
import org.fakester.common.component.display.CsvToAlarmLog;
import org.fakester.common.component.display.Image;
import org.fakester.common.component.display.ImageTest;
import org.fakester.common.component.display.Messenger;
import org.fakester.common.component.display.ScreenCapture;
import org.fakester.common.component.display.TagCounter;
import org.fakester.gateway.delegate.AWSInfraDelegate;
import org.fakester.gateway.delegate.MessageComponentModelDelegate;
import org.fakester.gateway.endpoint.DataEndpoints;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.inductiveautomation.ignition.common.licensing.LicenseState;
import com.inductiveautomation.ignition.common.util.LoggerEx;
import com.inductiveautomation.ignition.gateway.dataroutes.RouteGroup;
import com.inductiveautomation.ignition.gateway.model.AbstractGatewayModuleHook;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import com.inductiveautomation.perspective.common.api.ComponentRegistry;
import com.inductiveautomation.perspective.gateway.api.ComponentModelDelegateRegistry;
import com.inductiveautomation.perspective.gateway.api.PerspectiveContext;

public class RadGatewayHook extends AbstractGatewayModuleHook {

    private static final LoggerEx log = LoggerEx.newBuilder().build("rad.gateway.RadGatewayHook");
    private static final Logger logger = LoggerFactory.getLogger(JythonExecutor.class);

    private GatewayContext gatewayContext;
    private PerspectiveContext perspectiveContext;
    private ComponentRegistry componentRegistry;
    private ComponentModelDelegateRegistry modelDelegateRegistry;
    private ComponentModelDelegateRegistry awsDelegateRegistry;
    public static JythonExecutor jythonExecutor;
    public LogFileRetriever logFileRetriever;

    @Override
    public void setup(GatewayContext context) {
        this.gatewayContext = context;
        log.info("Setting up RadComponents module.");
        logger.info("adding jython class");
        jythonExecutor = new JythonExecutor(context);
        logger.info("after jython class addition");
    }

    @Override
    public void startup(LicenseState activationState) {
        log.info("Starting up RadGatewayHook!");

        this.perspectiveContext = PerspectiveContext.get(this.gatewayContext);
        this.componentRegistry = this.perspectiveContext.getComponentRegistry();
        this.modelDelegateRegistry = this.perspectiveContext.getComponentModelDelegateRegistry();
        this.awsDelegateRegistry = this.perspectiveContext.getComponentModelDelegateRegistry();

        try {
            ReadTag();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        if (this.componentRegistry != null) {
            log.info("Registering Rad components.");
            this.componentRegistry.registerComponent(CsvToAlarmLog.DESCRIPTOR);
            this.componentRegistry.registerComponent(ImageTest.DESCRIPTOR);
            this.componentRegistry.registerComponent(Image.DESCRIPTOR);
            this.componentRegistry.registerComponent(TagCounter.DESCRIPTOR);
            this.componentRegistry.registerComponent(Messenger.DESCRIPTOR);
            this.componentRegistry.registerComponent(ScreenCapture.DESCRIPTOR);
            this.componentRegistry.registerComponent(AWSInfraSVG.DESCRIPTOR);
            

        } else {
            log.error("Reference to component registry not found, Rad Components will fail to function!");
        }

        if (this.modelDelegateRegistry != null) {
            log.info("Registering model delegates.");
            this.modelDelegateRegistry.register(Messenger.COMPONENT_ID, MessageComponentModelDelegate::new);
        } else {
            log.error("ModelDelegateRegistry was not found!");
        }

        if (this.awsDelegateRegistry != null) {
            log.info("Registering aws model delegates.");
            this.awsDelegateRegistry.register(AWSInfraSVG.COMPONENT_ID, AWSInfraDelegate::new);
        } else {
            log.error("ModelDelegateRegistry was not found!");
        }
    }

    private void ReadTag() throws IOException {
        logger.info("creating value");
        // TODO Auto-generated method stub
        jythonExecutor.readTagValueX("[default]Simulation/Counter");
        jythonExecutor.readTagValueX("[default]Simulation/Random");
        logger.info("creatEd value");

        logFileRetriever = new LogFileRetriever(gatewayContext);
        logFileRetriever.SetLogQueryConfig(15, 1000, Level.INFO);
        logFileRetriever.GetLogQuery();
    }

    @Override
    public void shutdown() {
        log.info("Shutting down RadComponent module and removing registered components.");
        if (this.componentRegistry != null) {           
            this.componentRegistry.removeComponent(CsvToAlarmLog.COMPONENT_ID);
            this.componentRegistry.removeComponent(ImageTest.COMPONENT_ID);
            this.componentRegistry.removeComponent(Image.COMPONENT_ID);
            this.componentRegistry.removeComponent(TagCounter.COMPONENT_ID);
            this.componentRegistry.removeComponent(Messenger.COMPONENT_ID);
            this.componentRegistry.removeComponent(ScreenCapture.COMPONENT_ID);
            this.componentRegistry.removeComponent(AWSInfraSVG.COMPONENT_ID);

        } else {
            log.warn("Component registry was null, could not unregister Rad Components.");
        }
        if (this.modelDelegateRegistry != null ) {
            this.modelDelegateRegistry.remove(Messenger.COMPONENT_ID);
        }

        if (this.awsDelegateRegistry != null){
            this.modelDelegateRegistry.remove(AWSInfraSVG.COMPONENT_ID);
        }


    }

    @Override
    public Optional<String> getMountedResourceFolder() {
        return Optional.of("mounted");
    }

    @Override
    public void mountRouteHandlers(RouteGroup routeGroup) {
        // where you may choose to implement web server endpoints accessible via `host:port/system/data/
        DataEndpoints.mountRoutes(routeGroup);
    }

    // Lets us use the route http://<gateway>/res/radcomponents/*
    @Override
    public Optional<String> getMountPathAlias() {
        return Optional.of(RadComponents.URL_ALIAS);
    }

    @Override
    public boolean isFreeModule() {
        return true;
    }
}
