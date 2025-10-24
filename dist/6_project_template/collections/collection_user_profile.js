import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
export let collection_user_profile = new F_Collection('user_profile', 'user_profiles', z.object({
    _id: z_mongodb_id,
    user_id: z_mongodb_id,
    tenant_id: z_mongodb_id,
    display_name: z.string(),
    email: z.string(),
    timezone: z.string(),
}));
//# sourceMappingURL=collection_user_profile.js.map