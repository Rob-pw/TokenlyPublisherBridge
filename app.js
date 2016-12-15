var express = require('express');
var request = require('request');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var oip041 = require('oip-npm');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var fs = require("fs");
var dbfile = __dirname + '/tpb.db';
var exists = fs.existsSync(dbfile);
var db = new sqlite3.Database(dbfile);

// Include Florincoin RPC connection
var oip;

db.serialize(function() {
	if(!exists) {
		try {
			// Create the logs table
			db.run("CREATE TABLE log (id INTEGER PRIMARY KEY NOT NULL, timestamp INTEGER NOT NULL, type VARCHAR NOT NULL, message VARCHAR NOT NULL, extrainfo VARCHAR);");
		} catch (error) {
			console.log("Error creating database tables.");
		}
	}
});

var settings;

app.get('/', function (req, res) {
	res.status(403);
	res.send("");
});

app.post('/add', function (req, res) {
	var response;
	var status;
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	// Verify the IP is allowed
	if (ip != settings.allow_ip){
		status = 403;
		response = generateResponseMessage(false, "IP Not Allowed");
	}  // Test API Keys
	else if (req.body.api_key && req.body['api_key'] == settings['api_key']){
		// Verify artifact data is there, if not, throw an error.
		if (!req.body.artifact){
			status = 400;
			response = generateResponseMessage(false, "No artifact data detected in POST");
		} else {
			var oipArtifact = req.body.artifact;

			oip.publishArtifact(oipArtifact, function(oipRes){
				if (oipRes.success)
					status = 200;
				else
					status = 400;
				response = oipRes;
			})
		}
	} else {
		status = 403;
		response = generateResponseMessage(false, "Incorrect API Key");
	}

	// Check status
	if(status == 403){
		// Incorrect API key, log this.
		log("warning", response, "IP: " + ip)
	} else {
		log("info", response);
	}
	
	res.status(status)
	console.log(response);

	res.send(response);
});

app.post('/edit', function (req, res) {
	var response;
	var status;
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	// Verify the IP is allowed
	if (ip != settings.allow_ip){
		status = 403;
		response = generateResponseMessage(false, "IP Not Allowed");
	}  // Test API Keys
	else if (req.body.api_key && req.body['api_key'] == settings['api_key']){
		// Verify artifact data is there, if not, throw an error.
		if (!req.body.artifact){
			status = 400;
			response = generateResponseMessage(false, "No artifact data detected in POST");
		} else {
			var oipArtifact = req.body.artifact;

			oip.editArtifact(oipArtifact, function(oipRes){
				if (oipRes.success)
					status = 200;
				else
					status = 400;
				response = oipRes;
			})
		}
	} else {
		status = 403;
		response = generateResponseMessage(false, "Incorrect API Key");
	}

	// Check status
	if(status == 403){
		// Incorrect API key, log this.
		log("warning", response, "IP: " + ip)
	} else {
		log("info", response);
	}
	
	res.status(status)
	console.log(response);

	res.send(response);
});

app.post('/remove', function (req, res) {
	var response;
	var status;
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	// Verify the IP is allowed
	if (ip != settings.allow_ip){
		status = 403;
		response = generateResponseMessage(false, "IP Not Allowed");
	}  // Test API Keys
	else if (req.body.api_key && req.body['api_key'] == settings['api_key']){
		// Verify artifact data is there, if not, throw an error.
		if (!req.body.artifact){
			status = 400;
			response = generateResponseMessage(false, "No artifact data detected in POST");
		} else {
			var oipArtifact = req.body.artifact;

			oip.deactivateArtifact(oipArtifact, function(oipRes){
				if (oipRes.success)
					status = 200;
				else
					status = 400;
				response = oipRes;
			})
		}
	} else {
		status = 403;
		response = generateResponseMessage(false, "Incorrect API Key");
	}

	// Check status
	if(status == 403){
		// Incorrect API key, log this.
		log("warning", response, "IP: " + ip)
	} else {
		log("info", response);
	}
	
	res.status(status)
	console.log(response);

	res.send(response);
});

app.post('/transfer', function (req, res) {
	var response;
	var status;
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	// Verify the IP is allowed
	if (ip != settings.allow_ip){
		status = 403;
		response = generateResponseMessage(false, "IP Not Allowed");
	}  // Test API Keys
	else if (req.body.api_key && req.body['api_key'] == settings['api_key']){
		// Verify artifact data is there, if not, throw an error.
		if (!req.body.artifact){
			status = 400;
			response = generateResponseMessage(false, "No artifact data detected in POST");
		} else {
			var oipArtifact = req.body.artifact;

			oip.transferArtifact(oipArtifact, function(oipRes){
				if (oipRes.success)
					status = 200;
				else
					status = 400;
				response = oipRes;
			})
		}
	} else {
		status = 403;
		response = generateResponseMessage(false, "Incorrect API Key");
	}

	// Check status
	if(status == 403){
		// Incorrect API key, log this.
		log("warning", response, "IP: " + ip)
	} else {
		log("info", response);
	}

	res.status(status)
	console.log(response);

	res.send(response);
});

function log(type, message, extrainfo, table){
	if (!extrainfo)
		extrainfo = '';

	if (!table)
		table = 'log';

	if (table == 'log')
		var cols = '(timestamp, type, message, extrainfo)';

	// Store log in database
	db.serialize(function() {
		db.run("INSERT INTO " + table + " " + cols + " VALUES (" + parseInt(Date.now() / 1000) + ",'" + type + "', '" + message + "', '" + extrainfo + "');");
	});
}

function throwError(message, extraInfo){
	if (!extraInfo)
		extraInfo = '';

	log('error', message, extraInfo, 'log');

	console.log(message);
	console.log(extraInfo);
}

function loadConfig(){
	if (!fs.existsSync(__dirname + '/settings.cfg'))
		copyFile(__dirname + '/settings.example.cfg', __dirname + '/settings.cfg');

	var data = fs.readFileSync(__dirname + '/settings.cfg');
	try {
		if (data == ''){
			copyFile(__dirname + '/settings.example.cfg', __dirname + '/settings.cfg');
			var data = fs.readFileSync(__dirname + '/settings.cfg');
		}
		settings = JSON.parse(data);
	} catch(e) {
		throwError('Error loading Config', 'There was an error loading the config, please double check that it is correctly written and valid JSON!\n' + e);
	}
}

function saveConfig(){
	try {
		fs.writeFileSync(__dirname + '/settings.cfg', JSON.stringify(settings, null, 4));
	} catch (e) {
		throwError('Error writing config', e);
	}

}

function copyFile(source, target) {
	try {
		var data = fs.readFileSync(source);
		fs.writeFileSync(target, data);
	} catch (e) {
		throwError('Error creating default settings file from settings.example.cfg', e);
	}
}

function generateResponseMessage(success, message) {
	return '{ "success": ' + success + (success ? ', "message": "' : ', "error": "') + message + '"}';
}

loadConfig();

// Create oip-npm link
oip = new oip041({
     host: settings.florincoin_rpc_ip,
     port: settings.florincoin_rpc_port,
     username: settings.florincoin_username, 
     password: settings.florincoin_password
});

/*
// Example message signing
client.signMessage('FD6qwMcfpnsKmoL2kJSfp1czBMVicmkK1Q', 'TokenlyPublisherBridgeTestPublisher-FD6qwMcfpnsKmoL2kJSfp1czBMVicmkK1Q-1480201268', function(err, signature) {
	if (err) console.log(err);
	// Example message publishing
	client.sendToAddress('FD6qwMcfpnsKmoL2kJSfp1czBMVicmkK1Q', 0.0001, "", "", '{"alexandria-publisher":{"name":"TokenlyPublisherBridgeTestPublisher","address":"FD6qwMcfpnsKmoL2kJSfp1czBMVicmkK1Q","timestamp":1480201268,"emailmd5":"","bitmessage":""},"signature":"' + signature + '"}', function(err, msg) {
		if (err) console.log(err);
		console.log('Tx: ' + msg);
	});
});*/

app.listen(3200, function () {
	console.log('TokenlyPublisherBridge listening on port 3200!');
	log('info', 'Started up TokenlyPublisherBridge on port 3200');
});