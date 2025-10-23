import { F_Collection } from '@liminalfunctions/framework/F_Collection.js';
import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { F_SM_Open_Access } from '@liminalfunctions/framework/F_SM_Open_Access.js';
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
let collection_tenant = new F_Collection('tenant', 'tenants', z.object({
    _id: z_mongodb_id,
    name: z.string()
}));
let collection_client = new F_Collection('client', 'clients', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    tenant_id: z_mongodb_id,
}));
let collection_project = new F_Collection('project', 'projects', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    notes: z.string(),
    client_id: z_mongodb_id,
    tenant_id: z_mongodb_id,
}));
collection_user.add_layers([], [new F_SM_Open_Access(collection_user)]);
collection_tenant.add_layers([], [new F_SM_Open_Access(collection_tenant)]);
collection_client.add_layers(['tenant'], [new F_SM_Open_Access(collection_client)]);
collection_project.add_layers(['tenant', 'client'], [new F_SM_Open_Access(collection_project)]);
collection_project.add_layers(['tenant'], [new F_SM_Open_Access(collection_project)]);
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_tenant)
    .register(collection_client)
    .register(collection_project);
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
await collection_tenant.mongoose_model.deleteMany({ _id: { $ne: null } });
await collection_client.mongoose_model.deleteMany({ _id: { $ne: null } });
await collection_project.mongoose_model.deleteMany({ _id: { $ne: null } });
const barnaby_auth_id = uuid();
const barnaby_auth_header = { authorization: barnaby_auth_id };
let sample_user = await collection_user.perform_create_and_side_effects({
    name: 'Barnaby Otterwick',
    auth_system_id: barnaby_auth_id
});
const sample_user_id = '' + sample_user._id;
let sample_tenant_1 = await collection_tenant.perform_create_and_side_effects({
    name: 'Personal',
});
let sample_tenant_2 = await collection_tenant.perform_create_and_side_effects({
    name: 'Grisham Fine Sanitary Products',
});
let sample_client_1 = await collection_client.perform_create_and_side_effects({
    name: 'My Projects',
    tenant_id: sample_tenant_1._id
});
let sample_client_2 = await collection_client.perform_create_and_side_effects({
    name: 'Internal',
    tenant_id: sample_tenant_2._id
});
let sample_client_3 = await collection_client.perform_create_and_side_effects({
    name: 'Big Box Brands',
    tenant_id: sample_tenant_2._id
});
let sample_project_1 = await collection_project.perform_create_and_side_effects({
    name: `Find apology gift`,
    notes: `Carol didn't appreciate the PVC pipes. Find an apology gift to win her back! She's a botanist. Toilet paper is both practical and made of plants. Maybe I could get her one of those sampler packs of different premium toilet papers?`,
    tenant_id: sample_tenant_1._id,
    client_id: sample_client_1._id,
});
let sample_project_2 = await collection_project.perform_create_and_side_effects({
    name: 'XTrasoft product line development',
    notes: 'The XTrasoft line needs to revolutionize sanitary paper products.',
    tenant_id: sample_tenant_2._id,
    client_id: sample_client_2._id,
});
let sample_project_3 = await collection_project.perform_create_and_side_effects({
    name: 'Sampler pack marketing postmortem',
    notes: 'Analyze our TV ad campaign for points of improvement',
    tenant_id: sample_tenant_2._id,
    client_id: sample_client_2._id,
});
let sample_project_4 = await collection_project.perform_create_and_side_effects({
    name: 'Packaging revamp',
    notes: 'Big Box Brands redid their logo; we need to update our packaging to match.',
    tenant_id: sample_tenant_2._id,
    client_id: sample_client_3._id,
});
console.log(`fetching tenants:`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching all the clients within the "personal" tenant:`);
console.log(`// note that even though there are three clients, this endpoint retrieved only one: the one within the "personal" tenant.`);
console.log(`// this is because endpoints automatically add a filter to the query such that the returned documents are members of each previous layer.`);
console.log(`// this is why the client collection MUST have a tenant_id field, and the project collection MUST have both tenant_id and client_id fields:`);
console.log(`// they get used by by the framework in the background to automatically filter the results.`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching all the projects within the "Grisham Fine Sanitary Products" tenant:`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_2._id}/project/`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching all the projects within the Grisham Fine Sanitary Products" "Internal" client:`);
console.log(`// notice once more that only the products matching both the institution and client were returned.`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_2._id}/client/${sample_client_2._id}/project`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`attempting to get a project at the api root:`);
console.log(`// this API call fails because none of project's layers were set to the root. Project is accessible`);
console.log(`// from /tenant/<tenant_id>/project or tenant/<tenant_id>/client/<client_id>/project`);
try {
    console.log(await ky.get(`http://localhost:${port}/api/project/${sample_project_1._id}`, {
        headers: barnaby_auth_header
    }).json());
    console.log(`Hold on, that worked. Something is very wrong...`);
}
catch (err) {
    if (err.response?.status === 404) {
        console.log(`404 URL http://localhost:${port}/api/project/${sample_project_1._id} not found`);
    }
    else {
        console.log(err);
    }
}
console.log();
console.log();
console.log(`fetching the same project from the tenant level:`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/project/${sample_project_1._id}`, {
    headers: barnaby_auth_header
}).json());
//# sourceMappingURL=index.js.map