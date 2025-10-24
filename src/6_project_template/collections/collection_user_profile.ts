import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { F_SM_Ownership } from "@liminalfunctions/framework/F_SM_Ownership.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
import { get_sm_role_membership } from "./utils.js";

// define a collection for the user.
export let collection_user_profile = new F_Collection('user_profile', 'user_profiles', z.object({
        _id: z_mongodb_id,
        user_id: z_mongodb_id,
        tenant_id: z_mongodb_id, 
        display_name: z.string(),
        email: z.string(),
        timezone: z.string(),
    })
)
