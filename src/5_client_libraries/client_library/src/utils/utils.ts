// this is copied directly to ./utils/utils.ts

export function encode_search_params(params: {[key: string]: string | number | boolean | string[] | Date}): {[key: string]: string | number | boolean }{
    let retval: {[key: string]: string | number | boolean } = {}
    for(let [key, value] of Object.entries(params)){
        if(Array.isArray(value)){
            retval[key] = value.join(',')
        } else if(value instanceof Date){
            retval[key] = value.toISOString();
        } else {
            retval[key] = value;
        }
    }

    return retval;
}

export type Response<Q> = { data: Q }
export type Response_Multiple<Q> = { data: Q[] }