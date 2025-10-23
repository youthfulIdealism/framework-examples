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

    This example takes the shape of a multi-tenant app. Each tenant has clients, and each client has projects.
    Each user can be a member of one or more tenants, and has access to only tenants in which they are a member.
    Each member of a tenant has certain permissions, defined by their role_membership.

    This example is meant to demonstrate some of the security models that come built into Framework by default.
    They are opinionated, and tend to require your setup to be shaped a certain way.
*/


/*
    Set up Express and MongoDB
*/
// set up express
const port = 4601;
let express_app = express();
express_app.use(express.json());

// set up the mongodb connection
let db_connection = await mongoose.connect('mongodb://127.0.0.1:27017/'/* fill this in with your own mongodb URL */);

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


// define a collection for the tenants
let collection_tenant = new F_Collection('tenant', 'tenants', z.object({
    _id: z_mongodb_id,
    name: z.string()
}))

// define a collection for the roles
let collection_role = new F_Collection('role', 'roles', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    tenant_id: z_mongodb_id,
    permissions: z.record(z.string(), z.array(z.enum(['read', 'create', 'update', 'delete']))),
}))

// define a collection for the role memberships
let collection_role_membership = new F_Collection('role_membership', 'role_memberships', z.object({
    tenant_id: z_mongodb_id,
    user_id: z_mongodb_id,
    role_id: z_mongodb_id,
}))

// define a collection for the projects
let collection_project = new F_Collection('project', 'projects', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    notes: z.string(),
    tenant_id: z_mongodb_id,
}))


// Set up caches for the security models to use to look up role
// memberships and roles. This helps keep performance during authentication strong.
// Framework comes with its own built-in cache implementation, which should be
// broadly across the application used to maintain consistency.

//`${user_id}-${institution_id}` -> collection_role_membership
export let role_membership_cache = new Cache(1000 * 60);
// cache collection_role._id -> collection_user
export let role_cache = new Cache(1000 * 60);

// set up the layers and security models
// set up access to the users collection with a security model that allows any user to operate on the data. Dont' do this in prod, please.
collection_user.add_layers([], [new F_SM_Open_Access(collection_user)]);

// set up access to the tenants collection with a security model that allows for any user with an adequately powerful role membership to access the data
collection_tenant.add_layers([], [
    new F_SM_Role_Membership(
        collection_tenant,
        collection_tenant,// the "layer" collection, which in this case is the tenant
        collection_role_membership,// the role membership collection, which MUST have the fields user_id, <layer>_id, and role_id
        collection_role,// the role collection, which MUST have the field <layer>_id and "permissions", which MUST be a {[collection_id_plural]: ['read', 'create', 'update', 'delete']} map.
        role_membership_cache,
        role_cache,
    )
]);

// set up access to the tenants collection with a security model that allows for any user with an adequately powerful role membership to access the data
collection_project.add_layers(['tenant'], [
    new F_SM_Role_Membership(
        collection_project,
        collection_tenant,
        collection_role_membership,
        collection_role,
        role_membership_cache,
        role_cache,
    )
]);


/*
    Create the endpoints
*/

// set up the collection registry
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_tenant)
    .register(collection_project)
    .register(collection_role)
    .register(collection_role_membership)

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
await collection_user.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_tenant.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_project.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_role.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_role_membership.mongoose_model.deleteMany({_id: { $ne: null}});

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

// create sample tenants.
let sample_tenant_1 = await collection_tenant.perform_create_and_side_effects({
    name: 'Personal',
});

let sample_tenant_2 = await collection_tenant.perform_create_and_side_effects({
    name: 'Symbiotic Fungus Institute',
});

let sample_tenant_3 = await collection_tenant.perform_create_and_side_effects({
    name: "Grappley's Plant Nursery",
});

// set up roles for the first two tenants. One role will have broad permissions, and
// the other role will be restrictive.

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

// set up barnaby as an admin in the first tenant, and a schmuck in the second.
let barnaby_role_membership_tenant_1 = await collection_role_membership.perform_create_and_side_effects({
    role_id: role_sample_tenant_1._id,
    user_id: sample_user._id,
    tenant_id: sample_tenant_1._id,
})

let barnaby_role_membership_tenant_2 = await collection_role_membership.perform_create_and_side_effects({
    role_id: role_sample_tenant_2._id,
    user_id: sample_user._id,
    tenant_id: sample_tenant_2._id,
})

// set up some example projects

let sample_project_1 = await collection_project.perform_create_and_side_effects({
    name: 'Further investigate the Acer Saccharum plant',
    notes: 'The sugar maple is a super interesting tree! It produces maple syrup, beautiful fall folige, and high-quality timber. This plant is worth learning about!',
    tenant_id: sample_tenant_1._id,
})

let sample_project_2 = await collection_project.perform_create_and_side_effects({
    name: 'Further investigate the Acer Saccharum plant',
    notes: 'The sugar maple is a super interesting tree! It produces maple syrup, beautiful fall folige, and high-quality timber. This plant is worth learning about!',
    tenant_id: sample_tenant_2._id,
})

let sample_project_3 = await collection_project.perform_create_and_side_effects({
    name: 'Further investigate the Acer Saccharum plant',
    notes: 'The sugar maple is a super interesting tree! It produces maple syrup, beautiful fall folige, and high-quality timber. This plant is worth learning about!',
    tenant_id: sample_tenant_3._id,
})





console.log(`fetching all tenants:`)
console.log(`// Because the user is only allowed to fetch tenants where he's a member, this request will be denied.`)
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/`, {
        headers: barnaby_auth_header
    }).json())
    console.log(`Hold on, that worked. Something is very wrong...`)
} catch(err) {
    if(err.response?.status === 403){
        console.log(`403 permission denied`)
    } else {
        console.log(err);
    }
}


console.log()
console.log()
console.log(`fetching a tenant when the user has a role enabling him to make the fetch:`)
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()
console.log(`fetching a projects when the user has a role enabling him to make the fetch:`)
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/project`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()
console.log(`fetching a projects when the user has a role in the tenant, but the role does not give him permission to make the fetch:`)
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_2._id}/project`, {
    headers: barnaby_auth_header
}).json())
    console.log(`Hold on, that worked. Something is very wrong...`)
} catch(err) {
    if(err.response?.status === 403){
        console.log(`403 permission denied`)
    } else {
        console.log(err);
    }
}

console.log()
console.log()
console.log(`fetching a projects when the user has no role in the tenant:`)
try {
    console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_3._id}/project`, {
    headers: barnaby_auth_header
}).json())
    console.log(`Hold on, that worked. Something is very wrong...`)
} catch(err) {
    if(err.response?.status === 403){
        console.log(`403 permission denied`)
    } else {
        console.log(err);
    }
}

