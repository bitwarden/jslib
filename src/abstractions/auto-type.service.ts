export abstract class AutoTypeService {
    getTarget: () => Promise<string>;
    getPossibleTargets: () => string[];
    typeTarget: () => Promise<any>;
}
