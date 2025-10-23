import { F_Collection } from '@liminalfunctions/framework/F_Collection.js';
import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { v4 as uuid } from 'uuid';
import { z_mongodb_id } from '@liminalfunctions/framework/index.js';
import express from 'express';
import ky from 'ky';
import mongoose from "mongoose";
import z from 'zod/v4';
import { Security_Model_Allow } from './security_model_allow.js';
import { Security_Model_Deny } from './security_model_deny.js';
import { Security_Model_Low_Value_Assets } from './security_model_low_value_assets.js';
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
let collection_asset = new F_Collection('asset', 'assets', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    value: z.number(),
    client_id: z_mongodb_id,
    tenant_id: z_mongodb_id,
}));
collection_user.add_layers([], [new Security_Model_Allow(collection_user)]);
collection_tenant.add_layers([], [new Security_Model_Allow(collection_tenant)]);
collection_client.add_layers(['tenant'], [new Security_Model_Allow(collection_client)]);
collection_project.add_layers(['tenant', 'client'], [new Security_Model_Deny(collection_project), new Security_Model_Allow(collection_project)]);
collection_project.add_layers(['tenant'], [new Security_Model_Deny(collection_project)]);
collection_asset.add_layers(['tenant', 'client'], [new Security_Model_Low_Value_Assets(collection_asset)]);
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_tenant)
    .register(collection_client)
    .register(collection_project)
    .register(collection_asset);
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
await collection_asset.mongoose_model.deleteMany({ _id: { $ne: null } });
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
let sample_client_1 = await collection_client.perform_create_and_side_effects({
    name: 'My Projects',
    tenant_id: sample_tenant_1._id
});
let sample_project_1 = await collection_project.perform_create_and_side_effects({
    name: `Learn some Botany`,
    notes: `Carol is even angrier at me! She's mad that they cut down beautiful trees to make "worthless" luxury toilet paper! Oh, man, I really screwed up. Maybe I can make her happy if I learn some botany to show I care about trees and value her friendship?`,
    tenant_id: sample_tenant_1._id,
    client_id: sample_client_1._id,
});
let sample_asset_1 = await collection_asset.perform_create_and_side_effects({
    name: `Online Botany Course`,
    value: 7,
    tenant_id: sample_tenant_1._id,
    client_id: sample_client_1._id,
});
let sample_asset_2 = await collection_asset.perform_create_and_side_effects({
    name: `Botany Textbook`,
    value: 47,
    tenant_id: sample_tenant_1._id,
    client_id: sample_client_1._id,
});
console.log(`fetching tenants:`);
console.log(`// When you try to perform an operation (GET, POST, PUT, DELETE) on a collection, it reads through`);
console.log(`// each security model at the current layer path one by one and calls the "has_permission" method.`);
console.log(`// if the "has_permission" returns false, then that security model has denied access, and the next`);
console.log(`// security model will be tried. If the method returns true, then the security model has allowed`);
console.log(`// access, and the operation will be allowed. Only one security model has to allow access in order`);
console.log(`// for the operation to be performed.`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching projects:`);
console.log(`// this is an example of a having two security models on a layer for a collection. The project`);
console.log(`// collection's first security model denies access, and the second security model allows it.`);
console.log(`// The first security model will be called, resulting in a rejection. This will cause the`);
console.log(`// second security model to be called, resulting in acceptance.`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client/${sample_client_1._id}/project`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching projects at tenant level:`);
console.log(`// this is an example of a having different security models on different layers. The`);
console.log(`// tenant/client layer had both the deny and accept models, but on the tenant layer, there's only`);
console.log(`// a deny layer.`);
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/project`, {
        headers: barnaby_auth_header
    }).json());
    console.log(`Hold on, that worked. Something is very wrong...`);
}
catch (err) {
    if (err.response?.status === 403) {
        console.log(`403 permission denied`);
    }
    else {
        console.log(err);
    }
}
console.log();
console.log();
console.log(`fetching assets:`);
console.log(`// The asset security model constrains the DB query so that only assets with a value less than 10 can be returned.`);
console.log(`// As a result, one of the two assets are returned by this call.`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client/${sample_client_1._id}/asset`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching assets with a value greater than 200:`);
console.log(`// If we try to make a query that explicitly fetches high-value assets, the security model catches it and denies the request.`);
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client/${sample_client_1._id}/asset?value_gt=20`, {
        headers: barnaby_auth_header
    }).json());
    console.log(`Hold on, that worked. Something is very wrong...`);
}
catch (err) {
    if (err.response?.status === 403) {
        console.log(`403 permission denied`);
    }
    else {
        console.log(err);
    }
}
console.log();
console.log();
console.log(`creating asset:`);
console.log(`// Creating an asset with a low enough value will pass the security model`);
console.log(await ky.post(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client/${sample_client_1._id}/asset`, {
    headers: barnaby_auth_header,
    json: {
        name: `Fancy Cactus`,
        value: 8,
        tenant_id: sample_tenant_1._id,
        client_id: sample_client_1._id,
    }
}).json());
console.log();
console.log();
console.log(`creating asset with a high value:`);
console.log(`// Creating an asset with a high enough value will be denied by the security model`);
try {
    console.log(await ky.post(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client/${sample_client_1._id}/asset`, {
        headers: barnaby_auth_header,
        json: {
            name: `Raised Garden Bed`,
            value: 340,
            tenant_id: sample_tenant_1._id,
            client_id: sample_client_1._id,
        }
    }).json());
    console.log(`Hold on, that worked. Something is very wrong...`);
}
catch (err) {
    if (err.response?.status === 403) {
        console.log(`403 permission denied`);
    }
    else {
        console.log(err);
    }
}
console.log();
console.log();
console.log(`directly fetching asset with a high value:`);
console.log(`// Fetching a specific asset with a high value by ID even fails, because the security model is`);
console.log(`// capable of modifying the query. If the modified query fails to return any information, the special`);
console.log(`// handle_empty_query_results handler determines whether the issue was a security failing or merely`);
console.log(`// a lack of data.`);
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client/${sample_client_1._id}/asset/${sample_asset_2._id}`, {
        headers: barnaby_auth_header
    }).json());
    console.log(`Hold on, that worked. Something is very wrong...`);
}
catch (err) {
    if (err.response?.status === 403) {
        console.log(`403 permission denied`);
    }
    else {
        console.log(err);
    }
}
console.log();
console.log();
console.log(`directly fetching asset that does not exist:`);
console.log(`// Fetching a specific asset that doesn't exist correctly returns an empty response because of the handle_empty_query_results handler`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client/${sample_client_1._id}/asset/68f7bc3dc0a080944308c360`, {
    headers: barnaby_auth_header
}).json());
//# sourceMappingURL=index.js.map