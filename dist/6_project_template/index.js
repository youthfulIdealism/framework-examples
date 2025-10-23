let client_library = await import('./client_library/dist/index.js').catch(err => {
    console.error(`There was an error importing the client library. This example needs to be set up by running "node ./dist/5_client_libraries/setup.js". Please make sure you've run the setup.`);
    process.exit(-1);
});
let get_auth = async () => 'barnaby_otterwick';
const port = 4601;
let api = client_library.api(`http://localhost:${port}/api`, get_auth);
console.log(`getting the current user:`);
let users = await api.collection('user').query({ auth_system_id: 'barnaby_otterwick' });
let user = users[0];
console.log(user);
console.log();
console.log();
console.log(`getting projects assigned to the current user`);
let projects = await api.collection('project').query({ user_id: user._id });
console.log(projects);
console.log();
console.log();
console.log(`creating a project`);
let created_project = await api.collection("project").post({
    user_id: user._id,
    name: "Attend Carol's birthday party",
    notes: "Carol and I reconnected during our maple trip and are better friends than ever! A happy ending for everyone. I can't wait until her next birthday--I'm planning on getting her a couple two-gallon buckets of maple syrup for her morning pancakes. What great value!"
});
console.log(created_project);
console.log();
console.log();
console.log('fetching a specific project');
let fetched_project = await api.collection("project").document(created_project._id).get();
console.log(fetched_project);
console.log();
console.log();
console.log('updating a specific project');
let updated_project = await api.collection("project").document(created_project._id).put({
    name: "Attend Carol's next birthday party",
});
console.log(updated_project);
export {};
//# sourceMappingURL=index.js.map