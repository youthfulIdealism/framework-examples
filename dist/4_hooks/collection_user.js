import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
export let collection_user = new F_Collection('user', 'users', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    auth_system_id: z.string(),
}));
//# sourceMappingURL=collection_user.js.map