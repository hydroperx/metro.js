Fix bug:

- [ ] Fix dragging a tile causing wheel container to move.
- [x] On mobile, dragging a tile clicks it. Fix that.

Live pages:

- [x] color optional (i.e. tile may be transparent)
- [x] iconSize
- [x] labelColor (white or black)
- [x] style

API:

- [x] TilesController#setTileColor() -- Allow transparent parameter.

Icon issues:

- They do not show up in Next.js for some reason when building for production.

Other things:

- Change how style sheet baselines are included. (Decouple it from Container/HGroup/VGroup)