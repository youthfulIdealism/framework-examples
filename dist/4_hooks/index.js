import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { v4 as uuid } from 'uuid';
import express from 'express';
import ky from 'ky';
import mongoose from "mongoose";
import { collection_user } from './collection_user.js';
import { collection_project } from './collection_project.js';
import { collection_step } from './collection_steps.js';
import { collection_analytics } from './collection_analytics.js';
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
const barnaby_auth_id = uuid();
const barnaby_auth_header = { authorization: barnaby_auth_id };
let sample_user = await collection_user.perform_create_and_side_effects({
    name: 'Barnaby Otterwick',
    auth_system_id: barnaby_auth_id
});
const sample_user_id = '' + sample_user._id;
console.log(`fetching all the existing projects, steps, and analytics, just to show that the collections are empty`);
console.log(`If they're not empty, you may have forgotten to clear out the database :)`);
console.log(await ky.get(`http://localhost:${port}/api/project`, {
    headers: barnaby_auth_header
}).json());
console.log(await ky.get(`http://localhost:${port}/api/step`, {
    headers: barnaby_auth_header
}).json());
console.log(await ky.get(`http://localhost:${port}/api/analytics`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`creating a project`);
console.log(`There's an on_create hook defined for the project. This means that any time a project is created with the \`perform_create_and_side_effects\` method,`);
console.log(`or if a project is created through an auto-generated framework API endpoint, a MongoDB transaction will be created. The project will be created in the`);
console.log(`mongodb transaction, and the any database operation performed in the hook can use the transactions's session. This is an expensive operation!`);
console.log(`you should use the on_create hook sparingly. This also means that if any of the database operations performed in the on_create hook fail, then the create`);
console.log(`operation fails as well. In this case, the on_create hook sets up the project's steps.`);
console.log(`There's also an after_create hook defined for the project. Any time a project is created with the \`perform_create_and_side_effects\` method,`);
console.log(`or if a project is created through an auto-generated framework API endpoint, the methods passed to the after_create hook will be run. These do not occur`);
console.log(`in a transaction, and are permitted to fail silently. They should be entirely self-contained, having their own error handling and error reporting.`);
console.log(`In this case, the after_create method sets up analytics for the user.`);
console.log(await ky.post(`http://localhost:${port}/api/project`, {
    headers: barnaby_auth_header,
    json: {
        user_id: sample_user_id,
        name: 'Enter the fall maple trip raffle',
        notes: `I've become enamoured with the Acer Saccharum tree and I want to go see some glorious wild specimens. I need to enter the raffle. I know the chance that I'll win is low, but you miss every shot you don't take.`,
    }
}).json());
console.log();
console.log();
console.log(`fetching user steps`);
console.log(`notice how the steps were created automatically`);
console.log(await ky.get(`http://localhost:${port}/api/step`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching user analytics`);
console.log(`notice how the analytics were created automatically`);
console.log(await ky.get(`http://localhost:${port}/api/analytics`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`marking the steps as "finished"`);
console.log(`Just as framework provides on_create and after_create hooks, it also provides on_update, after_update, on_delete, and after_delete hooks. The after_update hook`);
console.log(`will be demonstrated here: we will mark each step "done", and each time we do, the after_update code will run and automatically update the finished_steps field`);
console.log(`for the user's analytics.`);
let steps = (await ky.get(`http://localhost:${port}/api/step`, {
    headers: barnaby_auth_header
}).json()).data;
for (let step of steps) {
    console.log(await ky.put(`http://localhost:${port}/api/step/${step._id}`, {
        headers: barnaby_auth_header,
        json: {
            status: "done"
        }
    }).json());
}
console.log();
console.log();
console.log(`fetching user analytics`);
console.log(`notice how the analytics were created automatically`);
console.log(await ky.get(`http://localhost:${port}/api/analytics`, {
    headers: barnaby_auth_header
}).json());
//# sourceMappingURL=index.js.map