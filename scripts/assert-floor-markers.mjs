import assert from 'node:assert/strict';
export async function assertCurrentFloorMarkers(page, selectedMarker) {
  const layer=page.locator('[data-floor-band]');
  assert.equal(await layer.count(),1);
  const floor=await layer.getAttribute('data-floor-band');
  assert.equal(await selectedMarker.getAttribute('data-floor'),floor);
  assert.equal(await selectedMarker.getAttribute('data-mapped'),'true');
  for(const marker of await page.locator('[data-person]').all())assert.equal(await marker.getAttribute('data-floor'),floor);
}
