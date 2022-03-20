import { NavigationExtras, Router } from '@angular/router';

const homeRoute = ["/"];

export class BaseGuardService {
    constructor(protected router: Router) { }

    /**
     * Cancels the current navigation and redirects the user to the Url specified, or back to a default route if no 
     * route is specified. Arguments are the same as Router.navigate.
     * You should return the result of this method from a CanActivate guard to cancel the current navigation.
     */
    protected redirect(redirectUrl: string | any[] = homeRoute, extras?: NavigationExtras): false {
        const command = Array.isArray(redirectUrl)
            ? redirectUrl
            : [redirectUrl];

        this.router.navigate(command, extras);
        return false;
    }
}
