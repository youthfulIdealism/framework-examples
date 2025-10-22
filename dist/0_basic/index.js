import { F_Collection } from '@liminalfunctions/framework/F_Collection.js';
import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { F_SM_Open_Access } from '@liminalfunctions/framework/F_SM_Open_Access.js';
import { F_SM_Ownership } from '@liminalfunctions/framework/F_SM_Ownership.js';
import { v4 as uuid } from 'uuid';
import { z_mongodb_id } from '@liminalfunctions/framework/index.js';
import express from 'express';
import ky from 'ky';
import mongoose from "mongoose";
import z from 'zod/v4';
const port = 4601;
let express_app = express();
express_app.use(express.json());
let db_connection = await mongoose.connect('mongodb://127.0.0.1:27017/');
let collection_user = new F_Collection('user', 'users', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    auth_system_id: z.string(),
}));
collection_user.add_layers([], [new F_SM_Open_Access(collection_user)]);
let collection_todo_item = new F_Collection('todo', 'todos', z.object({
    _id: z_mongodb_id,
    user_id: z_mongodb_id,
    priority: z.enum(['low', 'medium', 'high']),
    title: z.string(),
    body: z.string(),
    finished: z.boolean(),
}));
collection_todo_item.add_layers(['user'], [new F_SM_Ownership(collection_todo_item, 'user_id')]);
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_todo_item);
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
console.log(`fetching user Barnaby Otterwick:`);
console.log(await ky.get(`http://localhost:${port}/api/user/${sample_user_id}`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`creating TODO list items for Barnaby Otterwick:`);
console.log(await ky.post(`http://localhost:${port}/api/user/${sample_user_id}/todo`, {
    headers: barnaby_auth_header,
    json: {
        user_id: sample_user_id,
        priority: 'low',
        title: 'string cheese nose massage',
        body: 'I really love to gently press string cheese into my nose. I find that the wholesome aroma and fatty texture reduce my stress levels. Do this on my lunch break, if I have time.',
        finished: false,
    }
}).json());
console.log(await ky.post(`http://localhost:${port}/api/user/${sample_user_id}/todo`, {
    headers: barnaby_auth_header,
    json: {
        user_id: sample_user_id,
        priority: 'medium',
        title: 'mow the lawn',
        body: `The only equipment I have acces to is plastic scissors from the kindergarden, but darnit, it's gotta get done!`,
        finished: false,
    }
}).json());
console.log(await ky.post(`http://localhost:${port}/api/user/${sample_user_id}/todo`, {
    headers: barnaby_auth_header,
    json: {
        user_id: sample_user_id,
        priority: 'high',
        title: `Buy Carol a birthday present`,
        body: `I'm thinking eighty feet of PVC pipe from the hardware store ought to do. Carol likes PVC pipe, right?`,
        finished: false,
    }
}).json());
//# sourceMappingURL=index.js.map