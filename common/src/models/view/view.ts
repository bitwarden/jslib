export class View {
    protected buildViewModel<V extends View>(view: V, dataObj: any, map: any) {
        for (const prop in map) {
            if (!map.hasOwnProperty(prop)) {
                continue;
            }

            const objProp = dataObj[(map[prop] || prop)];
            (view as any)[prop] = objProp ? objProp : null;
        }
    }
}
