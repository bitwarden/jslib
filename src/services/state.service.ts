import { StateService as StateServiceAbstraction } from '../abstractions/state.service';

export class StateService implements StateServiceAbstraction {
    private state: any = {};

    get<T>(key: string): Promise<T> {
        if (this.state.hasOwnProperty(key)) {
            return Promise.resolve(this.state[key]);
        }
        return Promise.resolve(null);
    }

    save(key: string, obj: any): Promise<any> {
        this.state[key] = obj;
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        delete this.state[key];
        return Promise.resolve();
    }

    purge(): Promise<any> {
        this.state = {};
        return Promise.resolve();
    }
}
