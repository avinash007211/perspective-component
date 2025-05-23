package org.fakester.gateway;

import java.io.FileWriter;
import java.io.IOException;
import java.util.Calendar;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.inductiveautomation.ignition.common.logging.Level;
import com.inductiveautomation.ignition.common.logging.LogEvent;
import com.inductiveautomation.ignition.common.logging.LogQueryConfig;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;


public class LogFileRetriever {

    private static final Logger logger = LoggerFactory.getLogger(JythonExecutor.class);
    private static GatewayContext context = null;

    public LogQueryConfig logQueryConfig = null;
    
    public LogFileRetriever(GatewayContext context) {
        this.context = context;
    }

    public void SetLogQueryConfig(int endTime, int logLimit, Level level) {
        try{
            Calendar calendar = Calendar.getInstance();
            int difference = 0 - endTime;
            long endTimeMillis = calendar.getTimeInMillis();

            calendar.add(Calendar.MINUTE, difference);
            long startTimeMillis = calendar.getTimeInMillis();

            logQueryConfig = LogQueryConfig.newBuilder().betweenTime(startTimeMillis, endTimeMillis)
                                .atOrAbove(level)
                                .limitTo(logLimit)
                                .build();
        }
        catch (Exception ex)
        {
            logger.info(ex.getMessage());
        }
    }

    public void GetLogQuery() throws IOException {
        if (logQueryConfig == null){
            throw new NullPointerException("Log Query Config is null");
        }

        FileWriter fileToWrite = null;

        try {
            fileToWrite = new FileWriter("D://SystemLogs.txt");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        Calendar calendar = Calendar.getInstance();

        try{
            int counter = 0;

            var logResults = context.getLoggingManager().queryLogEvents(logQueryConfig);
            for (LogEvent log : logResults.getEvents()) {
                ++counter;
                fileToWrite.write("Event : "+counter+"\n");
                fileToWrite.write("Message : " + log.getMessage()+"\n");

                calendar.setTimeInMillis(log.getTimestamp());

                fileToWrite.write("Timestamp : " + calendar.getTime() +"\n");
                fileToWrite.write("Level : " + log.getLevel()+"\n");
                fileToWrite.write("Logger Name : " + log.getLoggerName()+"\n");
            }
            logger.info("Log file created successfully");
            fileToWrite.close();
        }
        catch(Exception ex){
            logger.info(ex.getMessage());
        }
    }


}