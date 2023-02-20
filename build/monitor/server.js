const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware2");
const axios = require('axios').default;
const fs = require('fs');
const { server_config } = require('./config.js');

console.log("Monitor starting...");

const server = restify.createServer({
    name: "MONITOR",
    version: "1.0.0"
});

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: [
        /^http:\/\/localhost(:[\d]+)?$/,
        "http://*.dappnode.eth",
        "http://*.my.ava.do"
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());


server.get("/ping", (req, res, next) => {
    res.send(200, "pong");
    next()
});

// checkpoints APIs
server.get("/:name/checkpointz/v1/beacon/slots/:slot", (req, res, next) => {
    const slot = req.params.slot;
    const name = req.params.name;
    const url = `https://${name}/checkpointz/v1/beacon/slots/${slot}`
    get(url, res, next)
});

// beacon chain is different
server.get("/beaconcha.in/api/v1/block/:slot", (req, res, next) => {
    const slot = req.params.slot;
    const url = `https://beaconcha.in/api/v1/block/${slot}`
    get(url, res, next)
});
server.get("/prater.beaconcha.in/api/v1/block/:slot", (req, res, next) => {
    const slot = req.params.slot;
    const url = `https://prater.beaconcha.in/api/v1/block/${slot}`
    get(url, res, next)
});
server.get("/beacon.gnosischain.com/api/v1/block/:slot", (req, res, next) => {
    const slot = req.params.slot;
    const url = `https://beacon.gnosischain.com/api/v1/block/${slot}`
    get(url, res, next)
});

const get = (url, res, next) => {
    axios.get(url,
        {
            headers: {
                // 'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
        }).then(
            response => {
                // console.dir(response.data.data)
                const data = response.data.data
                res.send(200, data)
                next();
            }
        ).catch(
            (error) => {
                console.log("Error contacting ", url, error);
                res.send(200, "failed")
                next();
            }
        )
}

server.get('/rest/*', (req, res, next) => {
    const path = req.params["*"]
    const url = `http://localhost:5052/${path}`

    axios({
        method: req.method,
        url: url,
        data: req.body,
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(function (response) {
        const data = response.data
        res.send(200, data)
        next();
    }).catch(function (error) {
        console.log("Error contacting ", url, error);
        res.send(200, "failed")
        next();
    });
});

server.get('/keymanager/*', (req, res, next) => {
    const path = req.params["*"]
    const url = `http://localhost:5052/${path}`
    processKeyMangerRequest(url, req, res, next);1
});


server.post('/keymanager/*', (req, res, next) => {
    const path = req.params["*"]
    const url = `http://localhost:5052/${path}`
    processKeyMangerRequest(url, req, res, next);
});

server.del('/keymanager/*', (req, res, next) => {
    const path = req.params["*"]
    const url = `http://localhost:5052/${path}`
    processKeyMangerRequest(url, req, res, next);
});

const processKeyMangerRequest = (url, req, res, next) => {
    const keymanagertoken = getKeyManagerToken();
    // console.log(req.body, url, keymanagertoken);
    axios({
        method: req.method,
        url: url,
        data: req.body,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${keymanagertoken}`
        },
    }).then(function (response) {
        const data = response.data
        res.send(200, data)
        next();
    }).catch(function (error) {
        console.log("Error contacting ", url, error);
        res.send(200, "failed")
        next();
    });
  }

const getKeyManagerToken = () => {
    try {
        const keymanagertoken = fs.readFileSync(server_config.keymanager_token_path, 'utf8');
        return keymanagertoken.trim();
    } catch (err) {
        console.error(err);
    }
}

server.listen(9999, function () {
    console.log("%s listening at %s", server.name, server.url);
});
