//todo : create a files.js - tools to manipulate dir / files
//todo : create a format.js - tools to formate data before sending them back for visualization
//todo : create a toolbox.js - various tools to be use

// require modules
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const geoJson = require('geojson');

// init var
const app = express();
const port = 3080;

var corsOptions = {
    orign: "http://localhost:3080",
    optionsSuccessStatus: 200,
}

var imageStorage = multer.diskStorage({
    // Destination to store image     
    destination: 'uploads', 
      filename: (req, file, cb) => {
          cb(null, file.originalname)
            // file.fieldname is name of the field (image)
            // path.extname get the uploaded file extension
    }
});

// retrieve the exten
function getExtension(file) {
    regex = new RegExp('[^.]+$');
    return file.match(regex);
}

// todo : move function in tools.js
// clean the dir upload 
function cleanDir() {
    fs.readdir('/uploads', (err, files) => {
        if (!err && files.length > 0) {
            files.forEach(file => {
                if (file != '' && getExtension(file) == "json" ) {
                    try {
                        fs.unlinkSync(file);
                    } catch (error) {
                        throw new Error("Files delation failed");
                    }
                }
            });
        }
    });
}


// todo : need to be simplified and improved 
function readFile(){
    var files =  fs.readdirSync(__dirname + '/uploads');
    var position_ca_file_name = "";
    var position_ca_file_content = "";
    var survey_results_file_name = "";    
    var survey_results_file_content= "";    
    var beacon_data = {};
    
    // loop on each files found in uploads dir
    files.forEach(file => { 
        if (file.substr(0, 3) == "pos") { // check if the json file we read is position_ca_....
            position_ca_file_name = file;
        }
        if (file.substr(0, 3) == "sur") { // check if the json file we read is survey_results_....
            survey_results_file_name = file;
        }
    });

    position_ca_file_content = JSON.parse(fs.readFileSync(__dirname + '/uploads/'+position_ca_file_name, 'utf8'));
    survey_results_file_content = JSON.parse(fs.readFileSync(__dirname + '/uploads/'+survey_results_file_name, 'utf8'));
    
    beacon_data["position_ca"] = position_ca_file_content;
    beacon_data["survey_results"] = survey_results_file_content;
    
    // return objects that content all beacon data
    return beacon_data;
}

function getSurveysInfos(data){
    let opus_rapid_count = 0;
    let opus_static_count = 0;
    let survey_complete_count = 0;
    let survey_error_count = 0;
    let number_survey = 0;
    let beacon_id = [];
    
    data.survey_results.forEach(survey => {
        if (beacon_id.indexOf(survey.beacon_id) == -1)
            beacon_id.push(survey.beacon_id);
        if (survey.source == "OPUS_STATIC")
            opus_static_count += 1;
        if (survey.source == "OPUS_RAPID")
            opus_rapid_count += 1;
        if (survey.status == "COMPLETE")
            survey_complete_count +=1;
        if (survey.status == "ERROR")
            survey_error_count +=1;
        number_survey +=1;
    });

    data["infos"] = {
        beacon_id: beacon_id,
        number_survey:number_survey,
        survey_complete_count: survey_complete_count,
        survey_error_count: survey_error_count,
        opus_rapid_count: opus_rapid_count,
        opus_static_count: opus_static_count,
        
    }

    return data;
}

function cleanSurveys(data) {
    // remove all survey that got an error status
    let clean_survey_results = [];

    Object.entries(data.survey_results).forEach(entry => {
        const [key, value] = entry;
        if (value.status == "COMPLETE") {
            clean_survey_results.push(value);
        }
    });
    delete data.survey_results;
    data["survey_results"] = clean_survey_results;
    return data;
}

// prepare the survey data for the
function formatSurveyData(data) {
    // beacon origin specific treatment
    let mapboxJson = [];
    let mapbox_beacon_fix = {
        "beacon_id":data.position_ca.beacon_id,
        "x":data.position_ca.x,
        "y":data.position_ca.y,
        "z":data.position_ca.z,
        "latitude":data.position_ca.latitude,
        "longitude":data.position_ca.longitude,
        "height":data.position_ca.height
    };

    // prepare surveys data to be geoJson parsed
    Object.values(data.survey_results).forEach(value => {
        mapboxJson.push({
            "survey_id": value.survey_id,
            "beacon_id":value.beacon_id,
            "source":value.source,
            "x":value.x,
            "y":value.y,
            "z":value.z,
            "latitude":value.latitude,
            "longitude":value.longitude,
            "height":value.height,
            "status":value.status,
            "x_variance":value.x_variance,
            "y_variance":value.y_variance,
            "z_variance":value.z_variance,
            "variance":value.variance,
            "obs_total":value.obs_total,
            "obs_used":value.obs_used,
            "start_time":value.start_time,
            "end_time":value.end_time,
            "created_at":value.created_at
        });
    });

    data.position_ca = geoJson.parse(mapbox_beacon_fix, {Point: ['latitude', 'longitude']})
    data.survey_results = geoJson.parse(mapboxJson, {Point: ['latitude', 'longitude']})
    return data;
}

// config upload file / dir
const upload = multer({
    storage: imageStorage,
    limits: {
      fileSize: 10000000 // 10000000 Bytes = 10 MB
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(json)$/)) { 
         // upload only png and jpg format
         return cb(new Error('Please upload a Json File'))
       }
     cb(undefined, true)
  }
}) 

// expose the files to the server
app.use(express.json());
app.use(express.static(process.cwd()+"/client/dist/client/"));
app.use(express.urlencoded({extended: true}));
app.use(cors(corsOptions));


// ============= API - start ================= //

// call api for upload the json file
app.post('/api/upload', upload.array('files', 2), (req, res) => {
    cleanDir();
    // todo : clear the directory if there are files in before proceed any further
    const files = req.files;
    if (Array.isArray(files) && files.length > 0) {
        res.json(files);
    } else
        throw new Error("Files upload failed");
});

// call to send back data for visualization
app.get('/api/data', (req, res) => {
    var data = {};
    
    data = readFile();
    data = getSurveysInfos(data);
    data = cleanSurveys(data); // todo : refactor to a better way
    data = formatSurveyData(data);

    res.json(data);
});

app.get('/', (req,res) => {
     res.sendFile(process.cwd()+"/client/dist/client/");
});

// ============= API - end ================= //

// specified on which port the server need to listen and what to execute on it
app.listen(port, () => {
    console.log("Server started at http://localhost:%s", port);
});
