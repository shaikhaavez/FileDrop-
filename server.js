require("dotenv").config();
const express = require("express");
const app = express();
const router = require("express").Router();
const multer = require("multer");
const PORT = process.env.PORT || 3000;
const path = require("path");
const File = require("./models/file");
const { v4: uuid4 } = require("uuid");
const cors = require("cors");

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )} ${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

let upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 * 100 },
}).single("myfile");

app.post("/", (req, res) => {
  console.log(req.file);
  //Store File
  upload(req, res, async (err) => {
    //Validate request
    if (!req.file) {
      return res.json({
        error: "All fields are required.",
        error2: err.message,
      });
    }

    if (err) {
      return res.status(500).send({ error: err.message });
    }

    //Store into Database
    const file = new File({
      filename: req.file.filename,
      uuid: uuid4(),
      path: req.file.path,
      size: req.file.size,
    });

    const response = await file.save();
    return res.json({
      file: `${process.env.APP_BASE_URL}/files/${response.uuid}`,
    });
    // http://localhost:3000/files/2344dfhvjbdfjhbd-cdn
  });

  //Response -> Link
});

// Cors
const corsOptions = {
  origin: process.env.ALLOWED_CLIENTS.split(","),
  // ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:3300']
};

// Default configuration looks like
// {
//     "origin": "*",
//     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//     "preflightContinue": false,
//     "optionsSuccessStatus": 204
//   }

app.use(cors(corsOptions));
app.use(express.static("public"));

const connectDB = require("./config/db");
connectDB();

app.use(express.json());

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

// Routes
app.use("/api/files", require("./routes/files"));
app.use("/files", require("./routes/show"));
app.use("/files/download", require("./routes/download"));

app.listen(PORT, console.log(`Listening on port ${PORT}.`));
