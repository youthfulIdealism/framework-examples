   //////////////////////////////////////////////////////////////////////////
  /////////////   THIS EXAMPLE IS NOT FINISHED YET  ////////////////////////
 /////////////   IGNORE IT  ///////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { v4 as uuid } from 'uuid';
import express, { Request } from 'express'
import ky from 'ky';
import mongoose from "mongoose";
import { collection_tenant } from './collections/collection_tenant.js'
import { collection_client_role_membership } from './collections/collection_client_role_membership.js';
import { collection_client } from './collections/collection_client.js'
import { collection_project } from './collections/collection_project.js'
import { collection_role } from './collections/collection_role.js'
import { collection_tenant_role_membership } from './collections/collection_tenant_role_membership.js'
import { collection_user } from './collections/collection_user.js'
import { collection_user_profile } from './collections/collection_user_profile.js'
import './collections/security_and_layers.js';
import { generate_client_library } from '@liminalfunctions/framework/generate_client_library.js';
import { rimraf } from 'rimraf';
import { cp, mkdir } from 'node:fs/promises';
import { exec } from 'node:child_process';


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
    .register(collection_tenant)
    .register(collection_client_role_membership)
    .register(collection_client)
    .register(collection_project)
    .register(collection_role)
    .register(collection_tenant_role_membership)
    .register(collection_user_profile)

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

// clean out the database
await collection_client_role_membership.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_client.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_project.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_role.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_tenant.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_tenant_role_membership.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_user.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_user_profile.mongoose_model.deleteMany({_id: { $ne: null}});

let tenant_0 = await collection_tenant.perform_create_and_side_effects({
    name: 'Watermelon Disposal Corporation'
})

let tenant_0_role_admin = await collection_role.mongoose_model.findOne({
    tenant_id: tenant_0._id,
    name: 'admin'
})
let tenant_0_role_standard = await collection_role.mongoose_model.findOne({
    tenant_id: tenant_0._id,
    name: 'standard'
})

let tenant_1 = await collection_tenant.perform_create_and_side_effects({
    name: 'Walrus Fungus Institute'
})

let tenant_1_role_admin = await collection_role.mongoose_model.findOne({
    tenant_id: tenant_1._id,
    name: 'admin'
})

// set up a sample admin user
let sample_admin = await collection_user.perform_create_and_side_effects({
    name: 'Barnaby Otterwick',
    auth_system_id: 'barnaby_otterwick'
});
let sample_admin_role_membership_tenant_0 = await collection_tenant_role_membership.perform_create_and_side_effects({
    tenant_id: tenant_0._id,
    user_id: sample_admin._id,
    role_id: tenant_0_role_admin._id
});
let sample_admin_role_membership_tenant_1 = await collection_tenant_role_membership.perform_create_and_side_effects({
    tenant_id: tenant_1._id,
    user_id: sample_admin._id,
    role_id: tenant_1_role_admin._id
});



// set up a sample normal user
let sample_standard_user = await collection_user.perform_create_and_side_effects({
    name: 'Carol Trussbury',
    auth_system_id: 'carol_trussbury'
});
let sample_standard_user_role_membership = await collection_tenant_role_membership.perform_create_and_side_effects({
    tenant_id: tenant_1._id,
    user_id: sample_standard_user._id,
    role_id: tenant_0_role_admin._id
});


// delete the old client library
await rimraf('./src/6_project_template/client_library');
await rimraf('./dist/6_project_template/client_library');
await mkdir('./src/6_project_template/client_library');

// generate the client library
await generate_client_library('./src/6_project_template/client_library', collection_registry);

// build the client library

// run npm install to fetch the client library's dependencies
await new Promise((resolve, rej) => {
    exec('npm install', { cwd: './src/6_project_template/client_library/' }, (err, stdout, stderr) => {
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
    exec('npm run-script build', { cwd: './src/6_project_template/client_library/' }, (err, stdout, stderr) => {
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
await cp('./src/6_project_template/client_library', './dist/6_project_template/client_library', {recursive: true});

console.log(`setup finished; feel free to run "node ./dist/6_project_template/index.js" in another console window`)