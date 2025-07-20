Fix bug:

- [x] On mobile, dragging a tile clicks it. Fix that.

Live pages:

- [ ] color optional (i.e. tile may be transparent)
- [x] iconSize
- [x] labelColor (white or black)
- [x] style

API:

- [ ] TilesController#setTileColor() -- Allow transparent parameter.

Icon issues:

- They do not show up in Next.js for some reason when building for production.

Other things:

- Change how style sheet baselines are included. (Decouple it from Container/HGroup/VGroup)