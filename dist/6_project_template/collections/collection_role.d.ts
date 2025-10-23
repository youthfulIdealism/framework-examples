import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import z from "zod/v4";
export declare let collection_role: F_Collection<"role", z.ZodObject<{
    _id: z.ZodCustom<string, string>;
    name: z.ZodString;
    tenant_id: z.ZodCustom<string, string>;
    permissions: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodEnum<{
        update: "update";
        create: "create";
        delete: "delete";
        read: "read";
    }>>>;
}, z.core.$strip>>;
