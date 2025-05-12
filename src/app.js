import express from "express"
import cors from "cors"


const app = express()


app.use(cors({
    origin: "*"
}));

app.use(express.json())
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(express.static("public"))

app.get('/', (req, res) => {
    res.send("Welcome to Air Monitoring API")
})



//Routes
import airMonitoringRouter from './routes/airMonitoring.route.js'

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

app.use('/api', airMonitoringRouter);

export default app;
