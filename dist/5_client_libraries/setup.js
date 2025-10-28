import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import express from 'express';
import mongoose from "mongoose";
import { collection_user } from './collection_user.js';
import { collection_project } from './collection_project.js';
import { collection_step } from './collection_steps.js';
import { collection_analytics } from './collection_analytics.js';
import { generate_client_library } from '@liminalfunctions/framework/generate_client_library.js';
import { rimraf } from 'rimraf';
import { cp, mkdir } from 'node:fs/promises';
import { exec } from 'node:child_process';


console.log('aksdhfja;lskjhdfas;oudfhaslo;df')

const port = 4601;
let express_app = express();
express_app.use(express.json());
let db_connection = await mongoose.connect('mongodb://127.0.0.1:27018,127.0.0.1:27019,127.0.0.1:27020/deletable_test?replicaSet=local_replica_set');
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_project)
    .register(collection_step)
    .register(collection_analytics);
collection_registry.compile(express_app, '/api');
F_Security_Model.set_auth_fetcher(async (req) => {
    if (!req.headers.authorization) {
        return undefined;
    }
    let user_record = await collection_user.mongoose_model.findOne({ auth_system_id: req.headers.authorization });
    if (!user_record) {
        return undefined;
    }
    return { user_id: user_record._id + '', layers: [] };
});
let server = express_app.listen(port);
await collection_user.mongoose_model.deleteMany({ _id: { $ne: null } });
await collection_project.mongoose_model.deleteMany({ _id: { $ne: null } });
await collection_step.mongoose_model.deleteMany({ _id: { $ne: null } });
await collection_analytics.mongoose_model.deleteMany({ _id: { $ne: null } });
let sample_user = await collection_user.perform_create_and_side_effects({
    name: 'Barnaby Otterwick',
    auth_system_id: 'barnaby_otterwick'
});
await rimraf('./src/5_client_libraries/client_library');
await rimraf('./dist/5_client_libraries/client_library');
await mkdir('./src/5_client_libraries/client_library');
await generate_client_library('./src/5_client_libraries/client_library', collection_registry);
await new Promise((resolve, rej) => {
    exec('npm install', { cwd: './src/5_client_libraries/client_library/' }, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            throw err;
        }
        console.error(stderr);
        resolve('');
    });
});
await new Promise((resolve, rej) => {
    exec('npm run-script build', { cwd: './src/5_client_libraries/client_library/' }, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            throw err;
        }
        console.error(stderr);
        resolve('');
    });
});
await cp('./src/5_client_libraries/client_library', './dist/5_client_libraries/client_library', { recursive: true });
console.log(`setup finished; feel free to run "node ./dist/5_client_libraries/index.js" in another console window`);
//# sourceMappingURL=setup.js.map