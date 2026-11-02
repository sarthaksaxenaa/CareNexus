# Body models

`frontend/public/models/body-{male,female}.glb` are generated, not hand-made.

1. **Generate** with [MPFB](https://github.com/makehumancommunity/mpfb2) (MakeHuman for Blender) running inside `bpy`:
   ```bash
   pip install bpy==5.2.*            # Blender as a Python module; install MPFB as an extension
   SKIN=cutoff3d_indian_female_enhanced.mhmat HAIR=ponytail01.mhclo \
   CLOTHES=clothes:punkduck_sport_bra.mhclo,clothes:punkduck_sport_briefs.mhclo \
     python make_body.py female body-female.glb
   SKIN=young_asian_male.mhmat HAIR=short02.mhclo CLOTHES=clothes:punkduck_sport_briefs.mhclo \
     python make_body.py male body-male.glb
   ```
   Asset packs needed in MPFB's data folder: `makehuman_system_assets`, `skins01`, `underwear02`.
   The script sets the body shape, lowers the arms from the A-pose, and writes a **`_REGION` vertex attribute**:
   the body-map region of every vertex (codes in `frontend/src/lib/regionCodes.ts`). `DEBUG_REGIONS=1` paints them.
2. **Compress** for the web (meshopt geometry, WebP textures, region codes left unquantised):
   ```bash
   npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp
   node optimize.mjs body-female.glb ../../frontend/public/models/body-female.glb
   TINT=0.6,0.4,0.28 node optimize.mjs body-male.glb ../../frontend/public/models/body-male.glb  # medium skin tone
   ```

Credits and licences: `frontend/public/models/CREDITS.md`.
