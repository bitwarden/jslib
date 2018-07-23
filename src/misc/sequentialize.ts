/**
 * Use as a Decorator on async functions, it will prevent multiple 'active' calls as the same time
 *
 * If a promise was returned from a previous call to this function, that hasn't yet resolved it will
 * be returned, instead of calling the original function again
 *
 * Results are not cached, once the promise has returned, the next call will result in a fresh call
 */
export function sequentialize(key: (args: any[]) => string = JSON.stringify) {
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
            value: (...args: any[]) => {
                const argsKey = key(args);
                const cache = getCache(this);
                let res = cache.get(argsKey);
                if (res != null) {
                    return res;
                }

                res = originalMethod.apply(this, args).then((val: any) => {
                    cache.delete(argsKey);
                    return val;
                }).catch((err: any) => {
                    cache.delete(argsKey);
                    throw err;
                });

                cache.set(argsKey, res);
                return res;
            },
        };
    };
}
