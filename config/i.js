'use strict';

const fs = require('fs');
const winston = require('winston');

process.env.SSH_AUTH_SOCK = __dirname+"/../ssh-agent.sock";

exports.sca = {
    auth_pubkey: fs.readFileSync('/home/sporiley/brainlife/sca-auth/api/config/auth.pub'),

    //password to encrypt/decrypt confidential resource information
    resource_enc_password: 'f^g#fdkjg2.afgfBkaCS-0ddj',
    resource_cipher_algo: 'aes-256-cbc',

    //jwt token used to access other services (like pulling users gids from auth service)
    jwt: fs.readFileSync(__dirname+'/sca.jwt').toString().trim(),
}

//used to use github api (like service.js)
exports.github = {
    client_id: "ab0e0c66e5d0443d57a1",
    client_secret: fs.readFileSync(__dirname+"/github.client.secret"),
}

exports.events = {
    //warning.. you don't get error message if your user/pass etc. are incorrect (it just keeps retrying silently..)
		amqp: {url: "amqp://sca:sca4all@localhost:5672/brainlife"},
    exchange: "wf", //used as prefix for full exchange name
}

//api endpoints for various services
exports.api = {
    auth: "https://brainlife.duckdns.org/api/auth",
}

exports.test = {
    //service test account/instance to use
    service: {
        user_id: "1", 
        instance_id: "570d1ef166a1e2fc1ef5a847",
    }
}

exports.task_handler = {
    //max number of concurrent task execution
    concurrency: 4,
}

exports.mongodb = "mongodb://localhost/sca";

exports.express = {
    port: 12403,
    //host: 0.0.0.0,
}

exports.progress = {
    api: 'https://brainlife.duckdns.org/api/progress',
}

exports.resources = require('./resources');

exports.logger = {
    winston: {
        //hide headers which may contain jwt
        requestWhitelist: ['url', /*'headers',*/ 'method', 'httpVersion', 'originalUrl', 'query'],
        transports: [
            //display all logs to console
            new winston.transports.Console({
                timestamp: function() {
                    var d = new Date();
                    return d.toString(); 
                },
                level: 'debug',
                colorize: true
            }),
        ]
    },
}

