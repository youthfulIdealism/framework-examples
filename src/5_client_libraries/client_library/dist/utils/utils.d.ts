export declare function encode_search_params(params: {
    [key: string]: string | number | boolean | string[] | Date;
}): {
    [key: string]: string | number | boolean;
};
export type Response<Q> = {
    data: Q;
};
export type Response_Multiple<Q> = {
    data: Q[];
};
