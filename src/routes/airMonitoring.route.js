
import {
    getAllAirData,
    addAirData,
    getAirDataStats,
    getMonthlyAverages,
    getHalfHourlyAverages,
    saveSensorLocation,
    uploadBinFile,
    getBinFile,
    sendMicroControllerLocation
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
  airMonitoringRouter.post("/upload-bin-file", deletePreviousBinFiles,upload.single("file"), uploadBinFile);
  airMonitoringRouter.get("/firmware", getBinFile);
  airMonitoringRouter.get("/get-controllers-location",sendMicroControllerLocation)
  
  export default airMonitoringRouter;