// node optimize.mjs in.glb out.glb — compress a body for the web.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, prune, reorder, quantize, textureCompress } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(input);

// Cut-out transparency, not blending: no sorting artefacts on skin, and the
// hidden eye and mouth patches of the skin texture are discarded.
for (const m of doc.getRoot().listMaterials()) {
  if (m.getAlphaMode() === 'BLEND') { m.setAlphaMode('MASK'); m.setAlphaCutoff(0.5); }
}
// Optional skin tint, e.g. TINT=0.74,0.56,0.43 to warm a pale texture to a medium tone.
if (process.env.TINT) {
  const tint = process.env.TINT.split(',').map(Number);
  for (const m of doc.getRoot().listMaterials()) if (/body/i.test(m.getName())) m.setBaseColorFactor([...tint, 1]);
}
await doc.transform(
  dedup(), prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048], quality: 82 }),
  reorder({ encoder: MeshoptEncoder }),
  // Keep the region codes exact: quantise only the standard attributes.
  quantize({ pattern: /^(POSITION|NORMAL|TEXCOORD_\d|TANGENT)$/ }),
);
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(output, doc);
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) console.log(m.getName(), p.listSemantics().join(','));
