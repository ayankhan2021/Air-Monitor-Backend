import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AirData } from "../models/airMonitoring.model.js";
import { SensorLocation } from "../models/sensorLocation.model.js";
import { console } from "inspector";
import path from "path";
import fs from "fs";

// @desc    Get all air monitoring data
// @route   GET /api/air-monitoring/get-air-data
// @access  Public
const getAllAirData = asyncHandler(async (req, res) => {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const airData = await AirData.find({
    timestamp: { $gte: twentyFourHoursAgo },
  })
    .sort({ timestamp: -1 })
    .limit(1000)
    .setOptions({ allowDiskUse: true });

  if (!airData || airData.length === 0) {
    console.log("No data found");
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No data found for the last 24 hours"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        airData,
        "Air Monitoring data from last 24 hours fetched successfully"
      )
    );
});

// @desc    Add air monitoring data
// @route   POST /api/air-monitoring/add-air-data
// @access  Public
const addAirData = asyncHandler(async (req, res) => {
  const { temperature, humidity, airquality } = req.body;
  if (
    temperature === undefined || temperature === null ||
    humidity === undefined || humidity === null ||
    airquality === undefined || airquality === null
  )
  {
    return res
      .status(400)
      .json(new ApiResponse(400, req.body, "Please provide all required fields"));
  }
  
  // Convert airquality to airQuality to match your schema
  const airData = await AirData({
    temperature, 
    humidity, 
    airQuality: airquality // Map to proper field name
  });
  
  await airData.save();
  if (!airData) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Error occurred while saving data"));
  }
  res
    .status(201)
    .json(
      new ApiResponse(201, airData, "Air Monitoring data added successfully")
    );
});

// @desc    Get monthly averages of air monitoring data
// @route   GET /api/air-monitoring/get-monthly-averages
// @access  Public
const getMonthlyAverages = asyncHandler(async (req, res) => {
  const { year, type } = req.query;
  console.log(year, type);
  if (!year || !type) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Year and type are required"));
  }

  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`);

  const monthlyAverages = await AirData.aggregate([
    {
      $match: {
        timestamp: { $gte: start, $lt: end },
        [type]: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        month: { $month: "$timestamp" },
        [type]: 1,
      },
    },
    {
      $group: {
        _id: "$month",
        sum: { $sum: `$${type}` },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        month: {
          $arrayElemAt: [
            [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
            { $subtract: ["$_id", 1] },
          ],
        },
        average: {
          $cond: [{ $gt: ["$count", 0] }, { $divide: ["$sum", "$count"] }, 0],
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const result = monthlyAverages.map((item) => ({
    month: item.month,
    [type]: parseFloat(item.average.toFixed(2)),
  }));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { monthlyAverages: result },
        "Monthly averages fetched successfully"
      )
    );
});

// @desc    Get air data stats
// @route   GET /api/air-monitoring/get-stat-data
// @access  Public
const getAirDataStats = asyncHandler(async (req, res) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const airData = await AirData.find({
    timestamp: { $gte: twentyFourHoursAgo },
  })
    .sort({ timestamp: -1 })
    .limit(1000)
    .setOptions({ allowDiskUse: true });

  if (airData.length === 0) {
    console.log("No datastat found");
    return res.status(404).json(new ApiResponse(404, {}, "No data"));
  }

  const buildStats = (type) => {
    const values = airData.map((entry) => parseFloat(entry[type]));
    const current = values[0];
    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    const getIncrease = (current, previous) => {
      if (previous === 0) return "0%";
      const diff = ((current - previous) / previous) * 100;
      return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    };

    const prev = values[values.length - 2] || current;

    return [
      {
        title: `Current ${type}`,
        value: current,
        increase: getIncrease(current, prev),
        description: `from last 24 hours"`,
        icon: type,
      },
      {
        title: `Highest ${type} Today`,
        value: highest,
        increase: getIncrease(highest, current),
        description: `from last 24 hours"`,
        icon: "up",
      },
      {
        title: `Lowest ${type} Today`,
        value: lowest,
        increase: getIncrease(lowest, current),
        description: `from last 24 hours"`,
        icon: "down",
      },
    ];
  };

  res.status(201).json(
    new ApiResponse(
      201,
      {
        temperature: buildStats("temperature"),
        humidity: buildStats("humidity"),
        airquality: buildStats("airquality"),
      },
      "Stats from last 24 hours"
    )
  );
});

const getHalfHourlyAverages = asyncHandler(async (req, res) => {
  try {
    let now = new Date();
    now = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const airData = await AirData.find({
      timestamp: { $gte: twentyFourHoursAgo },
    }).sort({ timestamp: 1 });

    if (airData.length === 0) {
      return res
        .status(202)
        .json(new ApiResponse(202, {}, "No data found in the last 24 hours"));
    }

    const halfHourlyAverages = [];
    const halfHourInMs = 30 * 60 * 1000;

    const minutes = now.getMinutes();
    const halfHourOffset = minutes % 30;
    const startTime = new Date(
      now.getTime() - (24 * 60 * 60 * 1000) - (halfHourOffset * 60 * 1000)
    );
    startTime.setSeconds(0, 0); 

    for (let i = 0; i < 48; i++) {
      const intervalStart = new Date(startTime.getTime() + (i * halfHourInMs));
      const intervalEnd = new Date(intervalStart.getTime() + halfHourInMs);

      const intervalData = airData.filter(
        data => data.timestamp >= intervalStart && data.timestamp < intervalEnd
      );

      const timeString = `${intervalStart.getHours().toString().padStart(2, '0')}:${
        intervalStart.getMinutes().toString().padStart(2, '0')
      }`;

      if (intervalData.length > 0) {
        const sumTemperature = intervalData.reduce((sum, data) => sum + (data.temperature || 0), 0);
        const sumHumidity = intervalData.reduce((sum, data) => sum + (data.humidity || 0), 0);
        const sumDust = intervalData.reduce((sum, data) => sum + (data.airQuality || 0), 0);

        halfHourlyAverages.push({
          timeRange: timeString,
          temperature: parseFloat((sumTemperature / intervalData.length).toFixed(2)),
          humidity: parseFloat((sumHumidity / intervalData.length).toFixed(2)),
          dust: parseFloat((sumDust / intervalData.length).toFixed(2))
        });
      } else {
        halfHourlyAverages.push({
          timeRange: timeString,
          temperature: null,
          humidity: null,
          dust: null
        });
      }
    }

    res
      .status(201)
      .json(new ApiResponse(201, 
        halfHourlyAverages, "Half-hourly temperature, humidity, and dust averages for the last 24 hours"));
  } catch (error) {
    console.error("Error calculating half-hourly averages:", error);
    res.status(500).json(new ApiResponse(500, {}, "Server Error"));
  }
});


const saveSensorLocation = asyncHandler(async (req, res) => {
  const { country, city, regionName, lon, lat } = req.body;
  console.log(req.body);
  if (!country || !city || !regionName || !lon || !lat) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Please provide all required fields"));
  }

  const sensorLocationData = {
    country,
    city,
    regionName,
    lon,
    lat,
  };

  const sensorLocation = await SensorLocation(sensorLocationData);
  await sensorLocation.save();
  if (!sensorLocation) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Error occurred while saving data"));
  }

  // delete the previous location stored
  await SensorLocation.deleteMany({ _id: { $ne: sensorLocation._id } });

  res
    .status(201)
    .json(
      new ApiResponse(201, sensorLocation, "Sensor location added successfully")
    );
});

const sendMicroControllerLocation = asyncHandler(async (req, res) => {
  const locations = await SensorLocation.find();

  console.log(locations)

  if (!locations) {
    return res
      .status(202)
      .json(new ApiResponse(202, null, "No Location Find to MicroController"));
  }

  return res.status(201).json(new ApiResponse (201, locations,
    "Locations fetched successfully"));
});

const uploadBinFile = (req, res) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json(new ApiResponse(400, null, "No file uploaded"));
  }

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "File uploaded successfully"));
};

const getBinFile = (req, res) => {
  const firmwareDir = '/tmp';

  try {
    const files = fs.readdirSync(firmwareDir);
    const firmwareFile = files.find(file => file.endsWith('.ino.bin'));

    if (!firmwareFile) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, 'No .ino.bin firmware file found'));
    }

    const filePath = path.join(firmwareDir, firmwareFile);
    console.log('Sending file:', filePath);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${firmwareFile}"`);

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        return res
          .status(500)
          .json(new ApiResponse(500, null, 'Error sending firmware file'));
      }

      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        } else {
          console.log('Firmware file deleted:', firmwareFile);
        }
      });
    });

  } catch (error) {
    console.error('Error in getBinFile:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

export {
  getAllAirData,
  addAirData,
  getMonthlyAverages,
  getAirDataStats,
  getHalfHourlyAverages,
  saveSensorLocation,
  uploadBinFile,
  getBinFile,
  sendMicroControllerLocation,
};
