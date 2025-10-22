import { F_Collection } from '@liminalfunctions/framework/F_Collection.js';
import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { F_SM_Open_Access } from '@liminalfunctions/framework/F_SM_Open_Access.js';
import { F_SM_Ownership } from '@liminalfunctions/framework/F_SM_Ownership.js';
import { Cache } from '@liminalfunctions/framework/cache.js';
import { v4 as uuid } from 'uuid';
import { z_mongodb_id, z_mongodb_id_nullable, z_mongodb_id_optional } from '@liminalfunctions/framework/index.js';
import express, { Request } from 'express'
import ky from 'ky';
import mongoose from "mongoose";
import z from 'zod/v4';
import { F_SM_Role_Membership } from '@liminalfunctions/framework/F_SM_Role_Membership.js';

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

/*
    Define the collections
*/

// define a collection for the user.
let collection_user = new F_Collection('user', 'users', z.object({
        _id: z_mongodb_id,
        name: z.string(),
        auth_system_id: z.string(),
    })
)

// define a collection for the projects
let collection_project = new F_Collection('project', 'projects', z.object({
    _id: z_mongodb_id,
    user_id: z_mongodb_id,
    name: z.string(),
    notes: z.string(),
}))
collection_project.add_layers([], [new F_SM_Open_Access(collection_project)]);

// define a collection for the steps
let collection_step = new F_Collection('step', 'steps', z.object({
    _id: z_mongodb_id,
    project_id: z_mongodb_id,
    user_id: z_mongodb_id,
    status: z.enum(['not started', 'started', 'done']),
    phase: z.enum(['beginning', 'middle', 'end']),
}))
collection_step.add_layers([], [new F_SM_Open_Access(collection_step)]);

// define a collection for the analytics
let collection_analytics = new F_Collection('analytics', 'analytics', z.object({
    _id: z_mongodb_id,
    user_id: z_mongodb_id,
    started_projects: z.number(),
    finished_steps: z.number(),
}))
collection_analytics.add_layers([], [new F_SM_Open_Access(collection_analytics)]);

/*
    Handle the business logic associated with the connections.
*/

// whenever a project is created, auto-generate the steps.
collection_project.on_create(async (session, created_document) => {
    for(let phase of ['beginning', 'middle', 'end']) {
        await collection_step.mongoose_model.create([{
            project_id: created_document._id,
            user_id: created_document.user_id,
            status: "not started",
            phase: phase,
        }], { session: session })
    }
})

// after a project is created, update the analytics for that user
collection_project.after_create(async (created_document) => {
    let analytics = await collection_analytics.mongoose_model.findOne({
        user_id: created_document.user_id
    }).lean()

    if(!analytics) {
        await collection_analytics.mongoose_model.create({
            user_id: created_document.user_id,
            started_projects: 1,
            finished_steps: 0,
        })
    } else {
        await collection_analytics.mongoose_model.findByIdAndUpdate(analytics._id, {
            $inc: { started_projects: 1 } 
        })
    }
})

// after a step is updated, update the analytics for that user
collection_step.after_update(async (updated_document) => {
    let [finished_steps, analytics] = await Promise.all([
        collection_step.mongoose_model.countDocuments({user_id: updated_document.user_id, status: 'done'}),
        collection_analytics.mongoose_model.findOne({
            user_id: updated_document.user_id
        }).lean()
    ])

    if(!analytics) {
        console.warn(`Something strange has happened--there weren't analytics available for the step already`)
        let project_count = await collection_project.mongoose_model.countDocuments({user_id: updated_document.user_id })

        await collection_analytics.mongoose_model.findOne({
            user_id: updated_document.user_id,
            started_projects: project_count,
            finished_steps: finished_steps,
        })
    } else {
        await collection_analytics.mongoose_model.findByIdAndUpdate(analytics._id, {
            finished_steps: finished_steps,
        })
    }
})


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


/*
    Demo everything
*/
// create a user
const barnaby_auth_id = uuid();
const barnaby_auth_header = { authorization: barnaby_auth_id };

let sample_user = await collection_user.perform_create_and_side_effects({
    name: 'Barnaby Otterwick',
    auth_system_id: barnaby_auth_id
});
const sample_user_id = '' + sample_user._id;

console.log(`fetching all the existing projects, steps, and analytics, just to show that the collections are empty`)
console.log(`If they're not empty, you may have forgotten to clear out the database :)`)
console.log(await ky.get(`http://localhost:${port}/api/project`, {
    headers: barnaby_auth_header
}).json())
console.log(await ky.get(`http://localhost:${port}/api/step`, {
    headers: barnaby_auth_header
}).json())
console.log(await ky.get(`http://localhost:${port}/api/analytics`, {
    headers: barnaby_auth_header
}).json())


console.log()
console.log()
console.log(`creating a project`)
console.log(`There's an on_create hook defined for the project. This means that any time a project is created with the \`perform_create_and_side_effects\` method,`)
console.log(`or if a project is created through an auto-generated framework API endpoint, a MongoDB transaction will be created. The project will be created in the`)
console.log(`mongodb transaction, and the any database operation performed in the hook can use the transactions's session. This is an expensive operation!`)
console.log(`you should use the on_create hook sparingly. This also means that if any of the database operations performed in the on_create hook fail, then the create`)
console.log(`operation fails as well. In this case, the on_create hook sets up the project's steps.`)
console.log(`There's also an after_create hook defined for the project. Any time a project is created with the \`perform_create_and_side_effects\` method,`)
console.log(`or if a project is created through an auto-generated framework API endpoint, the methods passed to the after_create hook will be run. These do not occur`)
console.log(`in a transaction, and are permitted to fail silently. They should be entirely self-contained, having their own error handling and error reporting.`)
console.log(`In this case, the after_create method sets up analytics for the user.`)
console.log(await ky.post(`http://localhost:${port}/api/project`, {
    headers: barnaby_auth_header,
    json: {
        user_id: sample_user_id,
        name: 'Enter the fall maple trip raffle',
        notes: `I've become enamoured with the Acer Saccharum tree and I want to go see some glorious wild specimens. I need to enter the raffle. I know the chance that I'll win is low, but you miss every shot you don't take.`,
    }
}).json())

console.log()
console.log()
console.log(`fetching user steps`)
console.log(`notice how the steps were created automatically`)
console.log(await ky.get(`http://localhost:${port}/api/step`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()
console.log(`fetching user analytics`)
console.log(`notice how the analytics were created automatically`)
console.log(await ky.get(`http://localhost:${port}/api/analytics`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()
console.log(`marking the steps as "finished"`)
console.log(`Just as framework provides on_create and after_create hooks, it also provides on_update, after_update, on_delete, and after_delete hooks. The after_update hook`)
console.log(`will be demonstrated here: we will mark each step "done", and each time we do, the after_update code will run and automatically update the finished_steps field`)
console.log(`for the user's analytics.`)
let steps = (await ky.get(`http://localhost:${port}/api/step`, {
    headers: barnaby_auth_header
}).json() as {data: {_id: string}[]}).data;

for (let step of steps){
    console.log(await ky.put(`http://localhost:${port}/api/step/${step._id}`, {
        headers: barnaby_auth_header,
        json: {
            status: "done"
        }
    }).json())
}

console.log()
console.log()
console.log(`fetching user analytics`)
console.log(`notice how the analytics were created automatically`)
console.log(await ky.get(`http://localhost:${port}/api/analytics`, {
    headers: barnaby_auth_header
}).json())