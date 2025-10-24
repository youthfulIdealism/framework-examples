import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import z from "zod/v4";
export declare let collection_user_profile: F_Collection<"user_profile", z.ZodObject<{
    _id: z.ZodCustom<string, string>;
    user_id: z.ZodCustom<string, string>;
    tenant_id: z.ZodCustom<string, string>;
    display_name: z.ZodString;
    email: z.ZodString;
    timezone: z.ZodString;
}, z.core.$strip>>;
