import express from 'express';
import routes from './api/routes/todoListRoutes';
import bodyParser from 'body-parser';
  
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
 
routes(app)
 
app.listen(PORT, () => {
    console.log(`Todo list RESTful API server started on: ${PORT}`);
})
