import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { v4 as uuid } from 'uuid';
import express, { Request } from 'express'
import ky from 'ky';
import mongoose from "mongoose";
import { collection_user } from './collection_user.js';
import { collection_project } from './collection_project.js';
import { collection_step } from './collection_steps.js';
import { collection_analytics } from './collection_analytics.js';
import { generate_client_library } from '@liminalfunctions/framework/generate_client_library.js';
import { rimraf } from 'rimraf';
import { cp, mkdir } from 'node:fs/promises';
import { exec } from 'node:child_process';

/* 

    This example takes the shape of a program that tracks projects. Each project has three steps: the beginning, the middle, and the end.
    A step is a seperate object in the database.

    There are also some analytics tools that track how many projects a user has created & how many steps a user has completed.

    
*/


/*
    Set up Express and MongoDB
*/
// set up express
const port = 4601;
let express_app = express();
express_app.use(express.json());

// set up the mongodb connection
let db_connection = await mongoose.connect('mongodb://127.0.0.1:27018,127.0.0.1:27019,127.0.0.1:27020/deletable_test?replicaSet=local_replica_set'/* fill this in with your own mongodb URL */);

// set up the collection registry
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_project)
    .register(collection_step)
    .register(collection_analytics)


// generate the express endpoints
collection_registry.compile(express_app, '/api');

// set up the auth context fetcher
F_Security_Model.set_auth_fetcher(async (req: Request) => {
    if(!req.headers.authorization){ return undefined; }

    // if there's an authorization header, find the user associated with that information
    let user_record = await collection_user.mongoose_model.findOne({auth_system_id: req.headers.authorization})
    if(!user_record){ return undefined; }
    return { user_id: user_record._id + '', layers: [] };
})

// start the express server
let server = express_app.listen(port);

// clean out the database and set up a sample user
collection_user.mongoose_model.deleteMany({});
let sample_user = await collection_user.perform_create_and_side_effects({
    name: 'Barnaby Otterwick',
    auth_system_id: 'barnaby_otterwick'
});

// delete the old client library
await rimraf('./src/5_client_libraries/client_library');
await rimraf('./dist/5_client_libraries/client_library');
await mkdir('./src/5_client_libraries/client_library');

// generate the client library
await generate_client_library('./src/5_client_libraries/client_library', collection_registry);

// build the client library

// run npm install to fetch the client library's dependencies
await new Promise((resolve, rej) => {
    exec('npm install', { cwd: './src/5_client_libraries/client_library/' }, (err, stdout, stderr) => {
        if (err) {
            // node couldn't execute the command
            console.error(err)
            throw err;
        }

        console.error(stderr)
        resolve('');
    });
})

// run npm build to compile the client library from typescript to javascript
await new Promise((resolve, rej) => {
    exec('npm run-script build', { cwd: './src/5_client_libraries/client_library/' }, (err, stdout, stderr) => {
        if (err) {
            // node couldn't execute the command
            console.error(err)
            throw err;
        }

        console.error(stderr)
        resolve('');
    });
})

// copy the client library to the ./dist folder so that the example code can use it
await cp('./src/5_client_libraries/client_library', './dist/5_client_libraries/client_library', {recursive: true});

console.log(`setup finished; feel free to run "node ./dist/5_client_libraries/index.js" in another console window`)