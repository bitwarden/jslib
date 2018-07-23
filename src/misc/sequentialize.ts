/**
 * Use as a Decorator on async functions, it will prevent multiple 'active' calls as the same time
 *
 * If a promise was returned from a previous call to this function, that hasn't yet resolved it will
 * be returned, instead of calling the original function again
 *
 * Results are not cached, once the promise has returned, the next call will result in a fresh call
 *
 * WARNING: The decorator's scope is singleton, so using it on transient objects can lead to memory leaks.
 * Read more at https://github.com/bitwarden/jslib/pull/7
 */
export function sequentialize(cacheKey: (args: any[]) => string) {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const originalMethod: () => Promise<any> = descriptor.value;
        const caches = new Map<any, Map<string, Promise<any>>>();

        const getCache = (obj: any) => {
            let cache = caches.get(obj);
            if (cache != null) {
                return cache;
            }
            cache = new Map<string, Promise<any>>();
            caches.set(obj, cache);
            return cache;
        };

        return {
            value: function(...args: any[]) {
                const argsCacheKey = cacheKey(args);
                const cache = getCache(this);
                let response = cache.get(argsCacheKey);
                if (response != null) {
                    return response;
                }

                response = originalMethod.apply(this, args).then((val: any) => {
                    cache.delete(argsCacheKey);
                    return val;
                }).catch((err: any) => {
                    cache.delete(argsCacheKey);
                    throw err;
                });

                cache.set(argsCacheKey, response);
                return response;
            },
        };
    };
}
