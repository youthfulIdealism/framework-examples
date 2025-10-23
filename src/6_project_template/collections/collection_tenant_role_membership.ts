import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";

export let collection_tenant_role_membership = new F_Collection('tenant_role_membership', 'tenant_role_memberships', z.object({
    _id: z_mongodb_id,
    tenant_id: z_mongodb_id,
    user_id: z_mongodb_id,
    role_id: z_mongodb_id,
}))


