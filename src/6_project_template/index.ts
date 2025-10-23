   //////////////////////////////////////////////////////////////////////////
  /////////////   THIS EXAMPLE IS NOT FINISHED YET  ////////////////////////
 /////////////   IGNORE IT  ///////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

// This example needs to be set up before it can be run. Please start the server and generate the client library
// by running `node ./dist/5_client_libraries/setup.js`. You can then run thes example in a seperate console.

let client_library = await import('./client_library/dist/index.js').catch(err => {
    console.error(`There was an error importing the client library. This example needs to be set up by running "node ./dist/5_client_libraries/setup.js". Please make sure you've run the setup.`)
    process.exit(-1);
});


// the client library accepts a function that returns the string contents of the auth header. This is where you'd
// integrate with supabase auth, firebase auth, etc on the frontend.
let get_auth = async () => 'barnaby_otterwick'

// set up the client library
const port = 4601;
let api = client_library.api(`http://localhost:${port}/api`, get_auth);

// get the current user. Notice that typescript will autocomplete the fields permitted by the queries.
console.log(`getting the current user:`)
let users = await api.collection('user').query({auth_system_id: 'barnaby_otterwick' })
let user = users[0];
console.log(user);

// get the projects assigned to the current user (should be empty). Notice that typescript will autocomplete
// the users fields.
console.log();
console.log();
console.log(`getting projects assigned to the current user`);
let projects = await api.collection('project').query({user_id: user._id})
console.log(projects)

console.log();
console.log();
console.log(`creating a project`);
let created_project = await api.collection("project").post({
    user_id: user._id,
    name: "Attend Carol's birthday party",
    notes: "Carol and I reconnected during our maple trip and are better friends than ever! A happy ending for everyone. I can't wait until her next birthday--I'm planning on getting her a couple two-gallon buckets of maple syrup for her morning pancakes. What great value!"
})
console.log(created_project);

console.log();
console.log();
console.log('fetching a specific project');
let fetched_project = await api.collection("project").document(created_project._id).get()
console.log(fetched_project);

console.log();
console.log();
console.log('updating a specific project');
let updated_project = await api.collection("project").document(created_project._id).put({
    name: "Attend Carol's next birthday party",
})
console.log(updated_project);