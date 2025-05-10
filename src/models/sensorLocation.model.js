import mongoose from 'mongoose';

const sensorLocationSchema = new mongoose.Schema({
    // country, city, state_name, longitude and latitude
    country: { type: String, required: true },
    city: { type: String, required: true },
    regionName: { type: String, required: true },
    lon: { type: Number, required: true },
    lat: { type: Number, required: true },
    });

export const SensorLocation = mongoose.model('SensorLocation', sensorLocationSchema);