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
        const cache = new Map<string, Promise<any>>();
        const originalMethod: () => Promise<any> = descriptor.value;

        return {
            value: function(...args: any[]) {
                const argsKey = key(args);

                let res = cache.get(argsKey);
                if (res) {
                    return res;
                }

                res = originalMethod.apply(this, args)
                    .then((val: any) => {
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
