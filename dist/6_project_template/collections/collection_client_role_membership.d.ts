import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import z from "zod/v4";
export declare let collection_client_role_membership: F_Collection<"client_role_membership", z.ZodObject<{
    _id: z.ZodCustom<string, string>;
    tenant_id: z.ZodCustom<string, string>;
    client_id: z.ZodCustom<string, string>;
    user_id: z.ZodCustom<string, string>;
    role_id: z.ZodCustom<string, string>;
}, z.core.$strip>>;
