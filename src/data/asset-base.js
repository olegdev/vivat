// ============================================================================
// ASSET BASE — the one place every fixture builds an image/video URL from.
//
// PORTING NOTE (PHP / Blade)
// Point these at the real asset pipeline and every mock in src/data/ follows;
// there is no second copy anywhere. In a Blade build this file goes away and
// the paths become `asset('images/...')` / a media-library URL on the model.
//
// Why relative and not absolute: the prototype has to open both from the Vite
// dev server and as a static folder, so URLs are relative to the *including
// page*. Every customer page sits at pages/customer/, so `../../assets/...` is
// uniform — the same rule partials follow (see CLAUDE.md).
// ============================================================================
export const ASSET_ROOT = "../../assets";

export const ICON = `${ASSET_ROOT}/header`;
export const HOME = `${ASSET_ROOT}/home`;
export const PDP = `${ASSET_ROOT}/pdp`;
export const ORDER = `${ASSET_ROOT}/order`;
export const ACTION = `${ASSET_ROOT}/action`;
