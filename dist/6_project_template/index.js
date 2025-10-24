let client_library = await import('./client_library/dist/index.js').catch(err => {
    console.error(`There was an error importing the client library. This example needs to be set up by running "node ./dist/5_client_libraries/setup.js". Please make sure you've run the setup.`);
    process.exit(-1);
});
const port = 4601;
let admin_user_api = client_library.api(`http://localhost:${port}/api`, async () => 'barnaby_otterwick');
let standard_user_api = client_library.api(`http://localhost:${port}/api`, async () => 'carol_trussbury');
console.log(`As an admin, fetching the tenants the user is permitted to see:`);
let admin_user = (await admin_user_api.collection('user').query({ auth_system_id: 'barnaby_otterwick' }))[0];
let admin_user_role_memberships = await admin_user_api.collection('tenant_role_membership').query({ user_id: admin_user._id });
let admin_user_tenants = [];
for (let role_membership of admin_user_role_memberships) {
    admin_user_tenants.push(await admin_user_api.collection('tenant').document(role_membership.tenant_id).get());
}
console.log(admin_user_tenants);
console.log();
console.log();
console.log(`As a standard user, fetching the tenants the user is permitted to see:`);
let standard_user = (await standard_user_api.collection('user').query({ auth_system_id: 'carol_trussbury' }))[0];
let standard_user_role_memberships = await standard_user_api.collection('tenant_role_membership').query({ user_id: standard_user._id });
let standard_user_tenants = [];
for (let role_membership of standard_user_role_memberships) {
    standard_user_tenants.push(await standard_user_api.collection('tenant').document(role_membership.tenant_id).get());
}
console.log(standard_user_tenants);
console.log();
console.log();
console.log(`As an admin user, create a client and project:`);
let standard_user_tenant = standard_user_tenants[0];
let client_0 = await admin_user_api.collection('tenant').document(standard_user_tenant._id).collection('client').post({
    tenant_id: standard_user_tenant._id,
    name: "sample client"
});
let project_0 = await admin_user_api.collection('tenant').document(standard_user_tenant._id).collection('client').document(client_0._id).collection('project').post({
    assignees: [standard_user._id],
    client_id: client_0._id,
    name: 'sample project 0',
    notes: 'created by the admin',
    tenant_id: client_0.tenant_id,
});
console.log(client_0);
console.log(project_0);
export {};
//# sourceMappingURL=index.js.map