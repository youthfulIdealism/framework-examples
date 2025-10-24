import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
import { add_standard_security } from "./utils.js";

export let collection_client_role_membership = new F_Collection('client_role_membership', 'client_role_memberships', z.object({
    _id: z_mongodb_id,
    tenant_id: z_mongodb_id,
    client_id: z_mongodb_id,
    user_id: z_mongodb_id,
    role_id: z_mongodb_id,
}))
