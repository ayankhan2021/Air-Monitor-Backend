import mongoose from 'mongoose';

const airDataSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    airQuality: { type: Number, required: true },
  });
  
export const AirData = mongoose.model('AirData', airDataSchema);  