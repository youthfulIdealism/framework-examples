import { F_Collection } from '@liminalfunctions/framework/F_Collection.js';
import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { F_SM_Open_Access } from '@liminalfunctions/framework/F_SM_Open_Access.js';
import { Cache } from '@liminalfunctions/framework/cache.js';
import { v4 as uuid } from 'uuid';
import { z_mongodb_id } from '@liminalfunctions/framework/index.js';
import express from 'express';
import ky from 'ky';
import mongoose from "mongoose";
import z from 'zod/v4';
import { F_SM_Role_Membership } from '@liminalfunctions/framework/F_SM_Role_Membership.js';
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
let collection_role = new F_Collection('role', 'roles', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    tenant_id: z_mongodb_id,
    permissions: z.record(z.string(), z.array(z.enum(['read', 'create', 'update', 'delete']))),
}));
let collection_role_membership = new F_Collection('role_membership', 'role_memberships', z.object({
    tenant_id: z_mongodb_id,
    user_id: z_mongodb_id,
    role_id: z_mongodb_id,
}));
let collection_project = new F_Collection('project', 'projects', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    notes: z.string(),
    tenant_id: z_mongodb_id,
}));
export let role_membership_cache = new Cache(1000 * 60);
export let role_cache = new Cache(1000 * 60);
collection_user.add_layers([], [new F_SM_Open_Access(collection_user)]);
collection_tenant.add_layers([], [
    new F_SM_Role_Membership(collection_tenant, collection_tenant, collection_role_membership, collection_role, role_membership_cache, role_cache)
]);
collection_project.add_layers(['tenant'], [
    new F_SM_Role_Membership(collection_project, collection_tenant, collection_role_membership, collection_role, role_membership_cache, role_cache)
]);
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_tenant)
    .register(collection_project)
    .register(collection_role)
    .register(collection_role_membership);
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
let sample_tenant_1 = await collection_tenant.perform_create_and_side_effects({
    name: 'Personal',
});
let sample_tenant_2 = await collection_tenant.perform_create_and_side_effects({
    name: 'Symbiotic Fungus Institute',
});
let sample_tenant_3 = await collection_tenant.perform_create_and_side_effects({
    name: "Grappley's Plant Nursery",
});
let role_sample_tenant_1 = await collection_role.perform_create_and_side_effects({
    name: 'Admin',
    tenant_id: sample_tenant_1._id,
    permissions: {
        tenants: ['read', 'create', 'update', 'delete'],
        roles: ['read', 'create', 'update', 'delete'],
        role_memberships: ['read', 'create', 'update', 'delete'],
        projects: ['read', 'create', 'update', 'delete'],
    }
});
let role_sample_tenant_2 = await collection_role.perform_create_and_side_effects({
    name: 'Schmuck',
    tenant_id: sample_tenant_1._id,
    permissions: {
        tenants: ['read'],
        roles: ['read'],
        role_memberships: ['read'],
        projects: [],
    }
});
let barnaby_role_membership_tenant_1 = await collection_role_membership.perform_create_and_side_effects({
    role_id: role_sample_tenant_1._id,
    user_id: sample_user._id,
    tenant_id: sample_tenant_1._id,
});
let barnaby_role_membership_tenant_2 = await collection_role_membership.perform_create_and_side_effects({
    role_id: role_sample_tenant_2._id,
    user_id: sample_user._id,
    tenant_id: sample_tenant_2._id,
});
let sample_project_1 = await collection_project.perform_create_and_side_effects({
    name: 'Further investigate the Acer Saccharum plant',
    notes: 'The sugar maple is a super interesting tree! It produces maple syrup, beautiful fall folige, and high-quality timber. This plant is worth learning about!',
    tenant_id: sample_tenant_1._id,
});
let sample_project_2 = await collection_project.perform_create_and_side_effects({
    name: 'Further investigate the Acer Saccharum plant',
    notes: 'The sugar maple is a super interesting tree! It produces maple syrup, beautiful fall folige, and high-quality timber. This plant is worth learning about!',
    tenant_id: sample_tenant_2._id,
});
let sample_project_3 = await collection_project.perform_create_and_side_effects({
    name: 'Further investigate the Acer Saccharum plant',
    notes: 'The sugar maple is a super interesting tree! It produces maple syrup, beautiful fall folige, and high-quality timber. This plant is worth learning about!',
    tenant_id: sample_tenant_3._id,
});
console.log(`fetching all tenants:`);
console.log(`// Because the user is only allowed to fetch tenants where he's a member, this request will be denied.`);
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/`, {
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
console.log(`fetching a tenant when the user has a role enabling him to make the fetch:`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching a projects when the user has a role enabling him to make the fetch:`);
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/project`, {
    headers: barnaby_auth_header
}).json());
console.log();
console.log();
console.log(`fetching a projects when the user has a role in the tenant, but the role does not give him permission to make the fetch:`);
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_2._id}/project`, {
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
console.log(`fetching a projects when the user has no role in the tenant:`);
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_3._id}/project`, {
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
//# sourceMappingURL=index.js.map