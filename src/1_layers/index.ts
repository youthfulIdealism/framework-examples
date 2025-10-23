import { F_Collection } from '@liminalfunctions/framework/F_Collection.js';
import { F_Collection_Registry } from '@liminalfunctions/framework/F_Collection_Registry.js';
import { F_Security_Model } from '@liminalfunctions/framework/F_Security_Model.js';
import { F_SM_Open_Access } from '@liminalfunctions/framework/F_SM_Open_Access.js';
import { F_SM_Ownership } from '@liminalfunctions/framework/F_SM_Ownership.js';
import { v4 as uuid } from 'uuid';
import { z_mongodb_id, z_mongodb_id_nullable, z_mongodb_id_optional } from '@liminalfunctions/framework/index.js';
import express, { Request } from 'express'
import ky from 'ky';
import mongoose from "mongoose";
import z from 'zod/v4';

/* 

    This example takes the shape of a multi-tenant app. Each tenant has clients, and each client has projects.
    This example builds off of the concepts in the 0_basic sample. If you're not familiar with Framework yet, start there.

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
let collection_user = new F_Collection(
    'user',// the name of the collection
    'users',// the plural name of the collection
    z.object({// the valdiator
        // mongodb IDs need to use the  special validator `z_mongodb_id`. If you modify the validator (for example, by using z_mongodb_id.optional() or z_mongodb_id.nullable()),
        // it will stop working properly. Instead, use the validators z_mongodb_id_nullable or z_mongodb_id_optional.
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

// define a collection for the clients
let collection_client = new F_Collection('client', 'clients', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    tenant_id: z_mongodb_id,// each tenant "has" clients, so we point back to the tenant from within the client document.
}))

// define a collection for the projects
let collection_project = new F_Collection('project', 'projects', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    notes: z.string(),
    client_id: z_mongodb_id,// each client "has" projects, so we point back to the tenant from within the project document.
    tenant_id: z_mongodb_id,// each tenant "has" projects within a given client, so we point back to the tenant from within the project document.
}))

// set up the access layers
// each layer represents a "has some" relationship. Concretely:
// - each tenant has some clients
// - each tenant has some tenant memberships
// - each tenant has some projects (which are contained in their clients)
// - each client has some client memberships
// - each client has some projects

// set up access to the users collection. This will make users accessible at the base level, at /api/user
collection_user.add_layers([], [new F_SM_Open_Access(collection_user)]);

// set up access to the tenants collection. similar to the user, nobody "owns" a tenant, because the tenant is the unit of ownership.
// The endpoint will be accessible at the base level, at /api/tenant
collection_tenant.add_layers([], [new F_SM_Open_Access(collection_tenant)]);

// each tenant "has some" clients, so we'll set the client to have the "['tenant']" layer.
// each layer MUST be the ID of another collection. This will enable clients to be accessed at the tenant level,
// at /api/tenant/<tenant_id>/client. If you add a layer to a collection, that collection MUST have a field that corresponds
// to that layer. For example, collection_client MUST have the field `tenant_id`, because we added a 'tenant' layer.
collection_client.add_layers(['tenant'],
    [new F_SM_Open_Access(collection_client)]// right now we're leaving the security at "anyone can perform the operation" for everything. See the security example to correct this.
);

// each client "has some" projects, so we'll set the project to have the ['tenant', 'client'] layers.
// note that this means project MUST have `tenant_id` and `client_id` fields. This means
// projects within a client will be accessible from the api/tenant/<tenant_id>/client/<client_id>/project endpoint
collection_project.add_layers(['tenant', 'client'], [new F_SM_Open_Access(collection_project)]);

// each tenant "has some" projects, so we'll add that layer, too. This means projects belonging to any client
// within the tenant will be accessible from the api/tenant/<tenant_id>/project endpoint.
collection_project.add_layers(['tenant'], [new F_SM_Open_Access(collection_project)]);


/*
    Create the endpoints
*/

// set up the collection registry
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_tenant)
    .register(collection_client)
    .register(collection_project)

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
await collection_client.mongoose_model.deleteMany({_id: { $ne: null}});
await collection_project.mongoose_model.deleteMany({_id: { $ne: null}});


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

// create a couple tenants
let sample_tenant_1 = await collection_tenant.perform_create_and_side_effects({
    name: 'Personal',
});

let sample_tenant_2 = await collection_tenant.perform_create_and_side_effects({
    name: 'Grisham Fine Sanitary Products',
});

// create some clients
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


// create some projects
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





console.log(`fetching tenants:`)
console.log(await ky.get(`http://localhost:${port}/api/tenant/`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()

console.log(`fetching all the clients within the "personal" tenant:`)
console.log(`// note that even though there are three clients, this endpoint retrieved only one: the one within the "personal" tenant.`)
console.log(`// this is because endpoints automatically add a filter to the query such that the returned documents are members of each previous layer.`)
console.log(`// this is why the client collection MUST have a tenant_id field, and the project collection MUST have both tenant_id and client_id fields:`)
console.log(`// they get used by by the framework in the background to automatically filter the results.`)
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/client`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()
console.log(`fetching all the projects within the "Grisham Fine Sanitary Products" tenant:`)
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_2._id}/project/`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()
console.log(`fetching all the projects within the Grisham Fine Sanitary Products" "Internal" client:`)
console.log(`// notice once more that only the products matching both the institution and client were returned.`)
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_2._id}/client/${sample_client_2._id}/project`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()
console.log(`attempting to get a project at the api root:`)
console.log(`// this API call fails because none of project's layers were set to the root. Project is accessible`)
console.log(`// from /tenant/<tenant_id>/project or tenant/<tenant_id>/client/<client_id>/project`)
try {
    console.log(await ky.get(`http://localhost:${port}/api/project/${sample_project_1._id}`, {
        headers: barnaby_auth_header
    }).json());
    console.log(`Hold on, that worked. Something is very wrong...`)
} catch(err) {
    if(err.response?.status === 404){
        console.log(`404 URL http://localhost:${port}/api/project/${sample_project_1._id} not found`)
    } else {
        console.log(err);
    }
}

console.log()
console.log()
console.log(`fetching the same project from the tenant level:`)
console.log(await ky.get(`http://localhost:${port}/api/tenant/${sample_tenant_1._id}/project/${sample_project_1._id}`, {
    headers: barnaby_auth_header
}).json())