
import {
    getAllAirData,
    addAirData,
    getAirDataStats,
    getMonthlyAverages,
    getHalfHourlyAverages,
    saveSensorLocation,
    uploadBinFile,
    getBinFile,
    sendMicroControllerLocation,
    getFirmwareInfo
  } from "../controllers/airMonitoringData.controller.js";
  import { upload, deletePreviousBinFiles } from "../middlewares/fileUpload.middleware.js"
  import { Router } from "express";
  
  const airMonitoringRouter = Router();
  
  airMonitoringRouter.post("/add-air-data", addAirData);
  airMonitoringRouter.post("/save-sensor-location", saveSensorLocation);
  airMonitoringRouter.get("/get-monthly-averages", getMonthlyAverages);
  airMonitoringRouter.get("/get-air-data", getAllAirData);
  airMonitoringRouter.get("/get-stat-data", getAirDataStats);
  airMonitoringRouter.get("/get-data-last-hour", getHalfHourlyAverages);
  airMonitoringRouter.get("/firmware", getBinFile);
  airMonitoringRouter.get("/get-controllers-location",sendMicroControllerLocation);
  airMonitoringRouter.get("/firmware-info", getFirmwareInfo);  

  airMonitoringRouter.post("/upload-bin-file", deletePreviousBinFiles, (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      console.error('Multer error:', err);
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: `Upload error: ${err.message}`,
        success: false
      });
    } else if (err) {
      // An unknown error occurred when uploading
      console.error('Unknown error:', err);
      return res.status(500).json({
        statusCode: 500,
        data: null,
        message: `Unknown upload error: ${err.message}`,
        success: false
      });
    }
    
    // Everything went fine, pass to actual controller
    uploadBinFile(req, res, next);
  });
});

  export default airMonitoringRouter;