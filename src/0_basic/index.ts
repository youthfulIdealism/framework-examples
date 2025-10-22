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

    This example takes the shape of a simple todo list app. It has only two collections: users and todo items.

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

// set up the access to the user collection. This is done via "layers". A "layer" is the heirachy of ways documents in a collection can be accessed.
// In this case, the user isn't "owned" by anything, so we set it up to be accessible at the base /api/ endpoint
collection_user.add_layers(
    [],// no layers between the base /api/ endpoint and the user
    [new F_SM_Open_Access(collection_user)] // the array of security models. In this case, we're allowing anyone access to the users collection,
                                            // so anyone can read/write/update/delete users. This is not secure, but this is example code, so it's fine.
);


// define a collection for the todo list item.
let collection_todo_item = new F_Collection('todo', 'todos', z.object({
    _id: z_mongodb_id,
    user_id: z_mongodb_id,// this is the ID of the owner.
    priority: z.enum(['low', 'medium', 'high']),
    title: z.string(),
    body: z.string(),
    finished: z.boolean(),
}))

// set up access to the todo collection.
collection_todo_item.add_layers(
    ['user'], //In this case, todo items are owned by individual users, so we want to make them to be accessed through /api/user/<user_id>/todo .
    [new F_SM_Ownership(collection_todo_item, 'user_id')]// In this case, we've chosen the F_SM_Ownership security mdoel, which will compare the
                                                         // contents of the user_id field against the authentication credentials.
)

/*
    Create the endpoints
*/

// the collection registry is the object responsible for storing all of the collections and
// compiling the Express endpoints. It is also used when generating client libraries (see later
// example files)
let collection_registry = (new F_Collection_Registry())
    .register(collection_user)
    .register(collection_todo_item)

// calling compile generates the express endpoints
collection_registry.compile(express_app, '/api');

// set up the code that generates the auth information across all endpoints. It is incumbent on this piece of code to return the user's current ID
// and the user's permissions within each layer. The security models take that information and make a decision about whether to allow a given operation.
// This is where you would integrate a seperate auth system--for example, Firebase auth or Supabase auth. For more details, see the security model example.
F_Security_Model.set_auth_fetcher(async (req: Request) => {
    // if there's no authorization header, return undefined because there's no user
    if(!req.headers.authorization){ return undefined; }

    // if there's an authorization header, find the user associated with that information
    let user_record = await collection_user.mongoose_model.findOne({auth_system_id: req.headers.authorization})

    // if no user was found, return undefined.
    if(!user_record){ return undefined; }

    // if a user was found, return an authorization object.
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

console.log(`fetching user Barnaby Otterwick:`)
console.log(await ky.get(`http://localhost:${port}/api/user/${sample_user_id}`, {
    headers: barnaby_auth_header
}).json())

console.log()
console.log()

console.log(`creating TODO list items for Barnaby Otterwick:`)
console.log(await ky.post(`http://localhost:${port}/api/user/${sample_user_id}/todo`, {
    headers: barnaby_auth_header,
    json: {
        user_id: sample_user_id,
        priority: 'low',
        title: 'string cheese nose massage',
        body: 'I really love to gently press string cheese into my nose. I find that the wholesome aroma and fatty texture reduce my stress levels. Do this on my lunch break, if I have time.',
        finished: false,
    }
}).json())
console.log(await ky.post(`http://localhost:${port}/api/user/${sample_user_id}/todo`, {
    headers: barnaby_auth_header,
    json: {
        user_id: sample_user_id,
        priority: 'medium',
        title: 'mow the lawn',
        body: `The only equipment I have acces to is plastic scissors from the kindergarden, but darnit, it's gotta get done!`,
        finished: false,
    }
}).json())
console.log(await ky.post(`http://localhost:${port}/api/user/${sample_user_id}/todo`, {
    headers: barnaby_auth_header,
    json: {
        user_id: sample_user_id,
        priority: 'high',
        title: `Buy Carol a birthday present`,
        body: `I'm thinking eighty feet of PVC pipe from the hardware store ought to do. Carol likes PVC pipe, right?`,
        finished: false,
    }
}).json())