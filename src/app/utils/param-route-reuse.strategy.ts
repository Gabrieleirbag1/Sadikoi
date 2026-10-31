import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * Angular keeps the page when only its parameters change: going from /group/5 to /group/12 (e.g. a
 * notification of another group tapped) would leave group 5 on screen. Here a page is rebuilt when its
 * parameters change, so it loads the new group.
 */
export class ParamRouteReuseStrategy extends BaseRouteReuseStrategy {
  public override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig && sameParams(future.params, curr.params);
  }
}

function sameParams(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => a[key] === b[key]);
}
