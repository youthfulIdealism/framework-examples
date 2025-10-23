import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
export let collection_user_profile = new F_Collection('user_profile', 'user_profiles', z.object({
    _id: z_mongodb_id,
    display_name: z.string(),
    email: z.string(),
    timezone: z.string(),
}));
collection_user_profile.add_layers([], [new F_SM_Open_Access(collection_user_profile)]);
//# sourceMappingURL=collection_user_profile.js.map