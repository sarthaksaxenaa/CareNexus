"""Generate a realistic MakeHuman body for the CareNexus body map.

usage: python make_body.py <male|female> <out.glb>

Environment:
  SKIN      skin .mhmat name (e.g. cutoff3d_indian_female_enhanced.mhmat)
  CLOTHES   comma list of subdir:file.mhclo
  TONE      optional "r,g,b" multiplier applied to the skin texture colour
  DEBUG_REGIONS=1  colour each region flat, to check the labelling

Every vertex is labelled with a body-map region, exported as the custom
attribute _REGION (an integer id, see REGION_IDS), so the website can tell
which body part was clicked and glow it on the skin itself.

Assets: MakeHuman base mesh, targets and skins are CC0; the sport bra and
briefs are CC-BY (punkduck). Coordinates here are Blender's: z up, x to the
character's left, and the body faces -y.
"""
import importlib
import json
import os
import sys

import bpy
import addon_utils
import numpy as np

sex, out = sys.argv[-2], sys.argv[-1]
addon_utils.enable("bl_ext.user_default.mpfb", default_set=True, persistent=True)
P = "bl_ext.user_default.mpfb"
HumanService = importlib.import_module(P + ".services.humanservice").HumanService
AssetService = importlib.import_module(P + ".services.assetservice").AssetService
TargetService = importlib.import_module(P + ".services.targetservice").TargetService
ExportService = importlib.import_module(P + ".services.exportservice").ExportService
ObjectService = importlib.import_module(P + ".services.objectservice").ObjectService
HumanObjectProperties = importlib.import_module(P + ".entities.objectproperties").HumanObjectProperties

# Must match frontend/src/lib/bodyRegions.ts (REGION_IDS).
REGION_IDS = {
    "head": 1, "neck": 2, "shoulder": 3, "chest": 4, "breast": 5, "abdomen": 6, "pelvis": 7,
    "back": 8, "arm": 9, "wrist": 10, "hand": 11, "hip": 12, "leg": 13, "knee": 14, "ankle": 15, "foot": 16,
}

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

# ── Body ───────────────────────────────────────────────────────────────────────
body = HumanService.create_human()
macros = {
    # South Asian: mostly caucasian bone structure with some asian and african;
    # the skin texture carries the tone.
    "caucasian": 0.6, "asian": 0.2, "african": 0.2,
    "age": 0.5,           # about 25
    "proportions": 0.75,  # towards idealised, not exaggerated
    "height": 0.5,
}
if sex == "male":
    macros.update({"gender": 1.0, "muscle": 0.6, "weight": 0.5})
else:
    macros.update({"gender": 0.0, "muscle": 0.45, "weight": 0.5, "cupsize": 0.5, "firmness": 0.6})
for k, v in macros.items():
    HumanObjectProperties.set_value(k, v, entity_reference=body)
TargetService.reapply_macro_details(body)


# ── Landmarks from the joint helpers (before helpers are removed) ──────────────
def landmarks(obj):
    saved = [m.show_viewport for m in obj.modifiers]
    for m in obj.modifiers:
        m.show_viewport = False
    ev = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    me = ev.to_mesh()
    co = np.array([v.co[:] for v in me.vertices])
    ev.to_mesh_clear()
    for m, s in zip(obj.modifiers, saved):
        m.show_viewport = s
    members = {}
    for v in obj.data.vertices:
        for g in v.groups:
            members.setdefault(g.group, []).append(v.index)
    idx = {g.name: g.index for g in obj.vertex_groups}

    def centre(name, side=None):
        pts = co[members[idx[name]]]
        if side is not None:
            pts = pts[np.sign(pts[:, 0]) == side]
        return pts.mean(0)

    lm = {n: centre("joint-" + n) for n in ["head", "head-2", "neck", "pelvis", "spine-1", "spine-2"]}
    for s, tag in ((1, "l"), (-1, "r")):
        for n in ["shoulder", "elbow", "hand", "finger-3-4", "upper-leg", "knee", "ankle", "toe-3-4"]:
            lm[f"{tag}-{n}"] = centre(f"joint-{tag}-{n}")
        lm[f"{tag}-nipple"] = centre("nipple", s)
    return lm


# A rig, so the arms can hang closer to the body than MakeHuman's wide
# A-pose (which would be clipped in the narrow body-map panel).
RigService = importlib.import_module(P + ".services.rigservice").RigService
rig = HumanService.add_builtin_rig(body, "default", import_weights=True)
ARM_DROP = float(os.environ.get("ARM_DROP", "30"))

# ── Skin, eyes, underwear ──────────────────────────────────────────────────────
def find(name, sub):
    return AssetService.find_asset_absolute_path(name, asset_subdir=sub)


skin = os.environ.get("SKIN")
if skin:
    path = find(skin, "skins")
    print("skin", skin, "->", path)
    if path:
        HumanService.set_character_skin(path, body, skin_type="GAMEENGINE")

extras = [("eyes", "low-poly.mhclo", "Eyes"), ("eyebrows", "eyebrow001.mhclo", "Eyebrows"),
          ("eyelashes", "eyelashes01.mhclo", "Eyelashes")]
if os.environ.get("HAIR"):
    extras.append(("hair", os.environ["HAIR"], "Hair"))
extras += [(*x.split(":"), "Clothes") for x in os.environ.get("CLOTHES", "").split(",") if x]
for sub, fname, atype in extras:
    path = find(fname, sub)
    print(atype, fname, "->", path)
    if path:
        HumanService.add_mhclo_asset(path, body, asset_type=atype, material_type="GAMEENGINE")


# ── Bake for export ────────────────────────────────────────────────────────────
def bake_shape_keys(obj):
    """Freeze the current mix of shape keys (the macros) into the mesh."""
    if obj.type != "MESH" or not obj.data.shape_keys:
        return
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shape_key_remove(all=True, apply_mix=True)


def lower_arms(armature, degrees):
    """Swing each upper arm down towards the body, about the front-back axis."""
    from mathutils import Matrix
    bpy.context.view_layer.update()
    for side, sign in (("L", 1), ("R", -1)):
        pb = armature.pose.bones.get(f"upperarm01.{side}")
        if pb is None:
            raise SystemExit(f"no upperarm01.{side} in rig")
        head = pb.head.copy()
        rot = Matrix.Translation(head) @ Matrix.Rotation(np.radians(degrees) * sign, 4, "Y") @ Matrix.Translation(-head)
        pb.matrix = rot @ pb.matrix
        bpy.context.view_layer.update()


lower_arms(rig, ARM_DROP)

root = ExportService.create_character_copy(body, name_suffix="_export")
eb = ObjectService.find_object_of_type_amongst_nearest_relatives(root, "Basemesh")
keep = {root} | set(ObjectService.get_list_of_children(root))
for o in keep:
    bake_shape_keys(o)

# Freeze the pose into every mesh, then drop the rig.
for o in keep:
    if o.type != "MESH":
        continue
    for m in [m for m in o.modifiers if m.type == "ARMATURE"]:
        for x in bpy.context.selected_objects:
            x.select_set(False)
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.modifier_apply(modifier=m.name)
LM = landmarks(eb)
if root.type == "ARMATURE":
    for o in list(keep):
        if o is not root and o.parent is not None:
            mw = o.matrix_world.copy()
            o.parent = eb if o is not eb else None
            o.matrix_world = mw
    eb.parent = None
    bpy.data.objects.remove(root, do_unlink=True)
    root = eb
ExportService.bake_modifiers_remove_helpers(eb, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True)
keep = {root} | set(ObjectService.get_list_of_children(root))
for o in list(bpy.data.objects):
    if o not in keep:
        bpy.data.objects.remove(o, do_unlink=True)


# ── Region labelling ───────────────────────────────────────────────────────────
def seg_dist(p, a, b):
    """Distance from points p (n,3) to segment a-b, and the segment parameter t."""
    ab = b - a
    t = np.clip(((p - a) @ ab) / (ab @ ab), 0.0, 1.0)
    return np.linalg.norm(p - (a + t[:, None] * ab), axis=1), t


def label(co, nrm, whole_head=False):
    n = len(co)
    out = np.zeros(n, dtype=np.int32)
    if whole_head:
        out[:] = REGION_IDS["head"]
        return out
    x, y, z = co[:, 0], co[:, 1], co[:, 2]
    side = np.where(x >= 0, "l", "r")
    get = lambda name: np.array([LM[f"{s}-{name}"] for s in side])

    sh, el, wr, ft = get("shoulder"), get("elbow"), get("hand"), get("finger-3-4")
    hp, kn, an, toe = get("upper-leg"), get("knee"), get("ankle"), get("toe-3-4")
    nip = get("nipple")

    def d_seg(a, b):
        ab = b - a
        t = np.clip(np.einsum("ij,ij->i", co - a, ab) / np.einsum("ij,ij->i", ab, ab), 0, 1)
        return np.linalg.norm(co - (a + t[:, None] * ab), axis=1), t

    d_upper, _ = d_seg(sh, el)
    d_fore, _ = d_seg(el, wr)
    d_hand, t_hand = d_seg(wr, ft)
    d_arm = np.minimum(np.minimum(d_upper, d_fore), d_hand)
    d_wrist = np.linalg.norm(co - wr, axis=1)
    d_shoulder = np.linalg.norm(co - sh, axis=1)

    d_thigh, _ = d_seg(hp, kn)
    d_shin, _ = d_seg(kn, an)
    d_knee = np.linalg.norm(co - kn, axis=1)
    d_ankle = np.linalg.norm(co - an, axis=1)
    d_nip = np.linalg.norm(co - nip, axis=1)

    head_z = LM["head"][2] - 0.035
    neck_z = LM["neck"][2] - 0.02
    chest_bottom = 0.5 * (LM["l-nipple"][2] + LM["spine-2"][2]) - 0.035
    hip_line = LM["l-upper-leg"][2] + 0.075
    crotch = LM["l-upper-leg"][2] - 0.085
    torso_y = 0.5 * (LM["spine-2"][1] + LM["pelvis"][1])
    front = np.where(np.abs(nrm[:, 1]) > 0.2, nrm[:, 1] < 0, y < torso_y)

    R = REGION_IDS
    is_arm = (d_arm < 0.085) & (np.abs(x) > np.abs(sh[:, 0]) * 0.82) & (z > crotch)
    is_leg = (z < crotch) & ~is_arm

    for i in range(n):
        if z[i] > head_z:
            out[i] = R["head"]
        elif z[i] > neck_z and abs(x[i]) < 0.085:
            out[i] = R["neck"]
        elif is_arm[i]:
            if d_shoulder[i] < 0.075 or (d_upper[i] <= d_fore[i] and z[i] > sh[i, 2] - 0.03 and abs(x[i]) < abs(sh[i, 0]) + 0.03):
                out[i] = R["shoulder"]
            elif d_wrist[i] < 0.04:
                out[i] = R["wrist"]
            elif d_hand[i] < d_fore[i] and t_hand[i] > 0.02:
                out[i] = R["hand"]
            else:
                out[i] = R["arm"]
        elif is_leg[i]:
            if z[i] < an[i, 2] - 0.03 or (z[i] < an[i, 2] + 0.02 and y[i] < an[i, 1] - 0.04):
                out[i] = R["foot"]
            elif d_ankle[i] < 0.055:
                out[i] = R["ankle"]
            elif d_knee[i] < 0.07:
                out[i] = R["knee"]
            elif z[i] > crotch - 0.07 and not front[i]:
                out[i] = R["hip"]  # buttocks
            else:
                out[i] = R["leg"]
        else:  # torso
            if z[i] > sh[i, 2] - 0.035 and abs(x[i]) > 0.11:
                out[i] = R["shoulder"]
            elif z[i] >= chest_bottom:
                if not front[i]:
                    out[i] = R["back"]
                elif sex == "female" and d_nip[i] < 0.10:
                    out[i] = R["breast"]
                else:
                    out[i] = R["chest"]
            elif z[i] >= hip_line:
                out[i] = R["abdomen"] if front[i] else R["back"]
            else:
                if front[i] and abs(x[i]) < 0.12:
                    out[i] = R["pelvis"] if sex == "female" else R["abdomen"]
                else:
                    out[i] = R["hip"]
    return out


DEBUG_COLOURS = {
    1: (0.9, 0.8, 0.6), 2: (0.6, 0.6, 0.9), 3: (0.9, 0.5, 0.2), 4: (0.9, 0.2, 0.2), 5: (1.0, 0.4, 0.7),
    6: (0.2, 0.8, 0.3), 7: (0.6, 0.2, 0.8), 8: (0.2, 0.4, 0.9), 9: (0.95, 0.85, 0.2), 10: (0.2, 0.9, 0.9),
    11: (0.6, 0.9, 0.3), 12: (0.5, 0.3, 0.1), 13: (0.3, 0.6, 0.6), 14: (0.9, 0.9, 0.9), 15: (0.1, 0.1, 0.1),
    16: (0.7, 0.7, 0.3),
}
counts = {}
for obj in keep:
    if obj.type != "MESH":
        continue
    me = obj.data
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3) @ np.array(obj.matrix_world)[:3, :3].T + np.array(obj.matrix_world)[:3, 3]
    nrm = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("normal", nrm)
    nrm = nrm.reshape(-1, 3)
    kind = obj.get("asset_type") or obj.name
    whole_head = any(k in str(kind).lower() for k in ("eye", "brow", "lash"))
    ids = label(co, nrm, whole_head=whole_head)
    attr = me.attributes.new(name="_REGION", type="FLOAT", domain="POINT")
    attr.data.foreach_set("value", ids.astype(np.float32))
    for k in np.unique(ids):
        counts[int(k)] = counts.get(int(k), 0) + int((ids == k).sum())
    if os.environ.get("DEBUG_REGIONS"):
        cols = np.array([DEBUG_COLOURS.get(int(i), (1, 1, 1)) + (1.0,) for i in ids], dtype=np.float32)
        ca = me.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
        ca.data.foreach_set("color", cols.ravel())
        mat = bpy.data.materials.new("debug")
        mat.use_nodes = True
        nt = mat.node_tree
        vc = nt.nodes.new("ShaderNodeVertexColor")
        vc.layer_name = "Col"
        nt.links.new(vc.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
        me.materials.clear()
        me.materials.append(mat)

print("REGIONS", {k: counts.get(v, 0) for k, v in REGION_IDS.items()})

bpy.ops.object.select_all(action="DESELECT")
for o in keep:
    o.select_set(True)
bpy.context.view_layer.objects.active = root
kwargs = dict(filepath=out, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
              export_image_format="AUTO", export_skins=False, export_animations=False, export_morph=False,
              export_attributes=True)
if os.environ.get("DEBUG_REGIONS"):
    kwargs["export_vertex_color"] = "ACTIVE"
bpy.ops.export_scene.gltf(**kwargs)
json.dump({k: [round(float(c), 4) for c in v] for k, v in LM.items()}, open(out + ".landmarks.json", "w"), indent=1)
print("WROTE", out, os.path.getsize(out))
