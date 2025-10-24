import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
import { SM_User } from "../security_models/SM_User.js";

// define a collection for the user.
export let collection_user = new F_Collection('user', 'users', z.object({
        _id: z_mongodb_id,
        name: z.string(),
        auth_system_id: z.string(),
    })
)