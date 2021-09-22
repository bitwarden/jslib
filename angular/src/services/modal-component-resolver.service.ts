import {
    ComponentFactory,
    ComponentFactoryResolver,
    Type,
} from '@angular/core';

export class ModalComponentResolverService {

    // Lazy loaded modules are not available in componentFactoryResolver,
    // therefore modules needs to manually initialize their resolvers.
    private factoryResolvers: Map<Type<any>, ComponentFactoryResolver> = new Map();

    constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

    registerComponentFactoryResolver<T>(componentType: Type<T>, componentFactoryResolver: ComponentFactoryResolver): void {
        this.factoryResolvers.set(componentType, componentFactoryResolver);
    }

    resolveComponentFactory<T>(componentType: Type<T>): ComponentFactory<T> {
        if (this.factoryResolvers.has(componentType)) {
            return this.factoryResolvers.get(componentType).resolveComponentFactory(componentType);
        }

        return this.componentFactoryResolver.resolveComponentFactory(componentType);
    }
}
