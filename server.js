import express from 'express';
import routes from './api/routes/todoListRoutes';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

const redis =require('redis');
  
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
 
routes(app)

/**
 * REDIS config
 */
const redisPort = 6379;
const redisPassword = "2020coronavirus2020";
//////////

const redisClient = redis.createClient({
  port: redisPort,
  host: "0.0.0.0",
  password: redisPassword
});

redisClient.on('error', err => {
  console.log('Error: ' + err);
});

redisClient.on('connect', () => {
  console.info('Redis client connected');
});
 
app.listen(PORT, () => {
    console.log(`Todo list RESTful API server started on: ${PORT}`);
})
