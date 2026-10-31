import { ActivatedRouteSnapshot, Route } from '@angular/router';
import { ParamRouteReuseStrategy } from './param-route-reuse.strategy';

describe('ParamRouteReuseStrategy', () => {
  const strategy = new ParamRouteReuseStrategy();
  const group: Route = { path: 'group/:id' };
  const snapshot = (routeConfig: Route | null, params: Record<string, string>) =>
    ({ routeConfig, params } as unknown as ActivatedRouteSnapshot);

  it('rebuilds the page when another group is opened', () => {
    expect(strategy.shouldReuseRoute(snapshot(group, { id: '12' }), snapshot(group, { id: '5' }))).toBe(false);
  });

  it('keeps the page when nothing changes', () => {
    expect(strategy.shouldReuseRoute(snapshot(group, { id: '5' }), snapshot(group, { id: '5' }))).toBe(true);
    expect(strategy.shouldReuseRoute(snapshot(null, {}), snapshot(null, {}))).toBe(true);
  });

  it('never reuses across different routes', () => {
    expect(strategy.shouldReuseRoute(snapshot({ path: '' }, {}), snapshot(group, { id: '5' }))).toBe(false);
  });
});
