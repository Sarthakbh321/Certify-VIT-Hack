const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const passport = require("passport");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
var QRCode = require('qrcode')
 


////routers
const eventRoutes = require('./Backend/routes/event.routes')
const userRoutes = require('./Backend/routes/user.routes');
const certificateRoutes = require('./Backend/routes/certificate.routes')
const s3UploadClient = require("./Backend/middleware/s3UploadClient");

const app = express();

const dbURI = process.env.dbURI;

mongoose
	.connect(dbURI, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("Database Connected"))
	.catch((err) => console.log(err));

mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// initialize passport
app.use(passport.initialize());
app.use(passport.session());


// Allow CORS
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization,auth-token"
	);
	if (req.method === "OPTIONS") {
		res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
		return res.status(200).json({});
	}
	next();
});

app.use(cors());
/////Rate Limiter
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 150, // limit each IP to 100 requests per windowMs
});

app.post("/upload", s3UploadClient.upload.array("inputFile", 1) , async (req,res)=>{
		res.status(200).json({
			body: req.files[0].location,
		})

} )


app.use('/user', userRoutes);
app.use('/event',eventRoutes)
app.use('/certificate', certificateRoutes)
//  apply to all requests
app.use(limiter);

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });



//route not found
app.use((req, res, next) => {
	const error = new Error("Route not found");
	error.status = 404;
	next(error);
});

app.get('/', (req, res, next)=>{
  res.send("Hello")
})

app.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		error: {
			message: error.message,
		},
	});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});
