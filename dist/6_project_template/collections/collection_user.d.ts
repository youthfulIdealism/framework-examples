import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import z from "zod/v4";
export declare let collection_user: F_Collection<"user", z.ZodObject<{
    _id: z.ZodCustom<string, string>;
    name: z.ZodString;
    auth_system_id: z.ZodString;
    is_super_admin: z.ZodBoolean;
}, z.core.$strip>>;
