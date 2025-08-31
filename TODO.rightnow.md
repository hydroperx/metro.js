# Tiles

- [ ] Remove attributes like direction that cause container to reset/rearrange
- [ ] Rename Tiles to TilesView
- [ ] Rename TilesController to Tiles
- [ ] Provide Tiles#direction getters/setters, dragEnabled etc.
  - [ ] Changing these settings should not destroy existing groups/tiles, unlike before. (It rearranges or changes event handlers, instead.)