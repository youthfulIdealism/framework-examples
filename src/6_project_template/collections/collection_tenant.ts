import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import { z } from "zod/v4";
import { collection_role } from "./collection_role.js";

// define a collection for the steps
export let collection_tenant = new F_Collection('tenant', 'tenants', z.object({
    _id: z_mongodb_id,
    name: z.string()
}))

collection_tenant.on_create(async (session, created_tenant) => {
    const all_permissions = ["read", "create", "update", "delete"];
    await collection_role.mongoose_model.create([{
        name: 'admin',
        tenant_id: created_tenant._id,
        permissions: {
            "client_role_memberships": all_permissions,
            "clients": all_permissions,
            "projects": all_permissions,
            "roles": all_permissions,
            "tenant_role_memberships": all_permissions,
            "user_profiles": all_permissions,
            "tenants": all_permissions
        }
    }], {session: session});

    await collection_role.mongoose_model.create([{
        name: 'standard',
        tenant_id: created_tenant._id,
        permissions: {
            "client_role_memberships": ["read"],
            "clients": ["read"],
            "projects": ["read", "create", "update"],
            "roles": ["read"],
            "tenant_role_memberships": ["read"],
            "user_profiles": ["read"],
            "tenants": ["read"]
        }
    }], {session: session});
})