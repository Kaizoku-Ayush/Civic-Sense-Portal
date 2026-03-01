"""
===================================
Explores all three available datasets and prints a detailed summary:
  1. Pothole Segmentation YOLOv8  (dataset/potholes/)
  2. Road Damage India / PASCAL VOC (dataset/road damage/India/)
  3. Garbage — Kaggle Archive       (dataset/garbage/archive/)
  4. Garbage — TACO COCO            (dataset/garbage/TACO/)

Run from project root:
    python ai-service/scripts/explore_datasets.py
"""

import os
import sys
import json
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

# ── resolve project root regardless of cwd ──────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent  # ai-service/scripts -> ai-service -> root
DATASET_ROOT = PROJECT_ROOT / "dataset"


# ── helpers ──────────────────────────────────────────────────────────────────
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def count_images(folder: Path) -> int:
    """Recursively count image files in a folder."""
    if not folder.exists():
        return 0
    return sum(1 for f in folder.rglob("*") if f.suffix.lower() in IMAGE_EXTS)


def count_images_flat(folder: Path) -> int:
    """Count image files in a single (non-recursive) folder."""
    if not folder.exists():
        return 0
    return sum(1 for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTS)


def separator(title: str = "") -> None:
    width = 60
    if title:
        pad = (width - len(title) - 2) // 2
        print(f"\n{'─' * pad} {title} {'─' * pad}")
    else:
        print("─" * width)


# ── 1. Pothole YOLOv8 dataset ────────────────────────────────────────────────
def explore_pothole_dataset():
    separator("DATASET 1 · Pothole Segmentation YOLOv8")
    base = DATASET_ROOT / "potholes" / "Pothole_Segmentation_YOLOv8"

    if not base.exists():
        print(f"  ✗  Not found: {base}")
        return {}

    yaml_path = base / "data.yaml"
    if yaml_path.exists():
        print(f"  data.yaml found")
        print("  " + yaml_path.read_text(encoding="utf-8").strip().replace("\n", "\n  "))

    splits = {}
    for split in ("train", "valid"):
        img_dir = base / split / "images"
        lbl_dir = base / split / "labels"
        n_img = count_images_flat(img_dir)
        n_lbl = sum(1 for f in lbl_dir.iterdir() if f.suffix == ".txt") if lbl_dir.exists() else 0
        splits[split] = n_img
        print(f"\n  [{split}]  images: {n_img}  |  label files: {n_lbl}")

    total = sum(splits.values())
    print(f"\n  TOTAL images : {total}")
    print(f"  Format       : YOLOv8 segmentation (polygon masks)")
    print(f"  Classes      : 1  →  ['Pothole']")
    print(f"  → Mapped to  : 'pothole' class in unified dataset")
    return splits


# ── 2. Road Damage India (Pascal VOC XML) ────────────────────────────────────
def explore_road_damage_dataset():
    separator("DATASET 2 · Road Damage India (PASCAL VOC)")
    base = DATASET_ROOT / "road damage" / "India"

    if not base.exists():
        print(f"  ✗  Not found: {base}")
        return {}

    results = {}
    all_classes = Counter()

    for split in ("train", "test"):
        img_dir = base / split / "images"
        ann_dir = base / split / "annotations" / "xmls"

        n_img = count_images_flat(img_dir)
        xml_files = list(ann_dir.glob("*.xml")) if ann_dir.exists() else []

        annotated = 0
        empty = 0
        class_counts = Counter()

        for xml_file in xml_files:
            try:
                root = ET.parse(xml_file).getroot()
                objs = root.findall("object")
                if objs:
                    annotated += 1
                    for o in objs:
                        name_el = o.find("name")
                        if name_el is not None:
                            class_counts[name_el.text.strip()] += 1
                else:
                    empty += 1
            except ET.ParseError:
                pass  # skip malformed XMLs

        all_classes.update(class_counts)
        results[split] = {
            "images": n_img,
            "xml_files": len(xml_files),
            "annotated": annotated,
            "empty_xml": empty,
            "classes": dict(class_counts),
        }

        print(f"\n  [{split}]")
        print(f"    Images total  : {n_img}")
        print(f"    XML files     : {len(xml_files)}")
        print(f"    Annotated     : {annotated}  (have ≥1 object)")
        print(f"    Empty XML     : {empty}   (road with no damage label)")
        if class_counts:
            print(f"    Class breakdown:")
            for cls, cnt in sorted(class_counts.items()):
                print(f"      {cls:10s} : {cnt:5d} bounding boxes")

    print(f"\n  All classes across splits : {dict(all_classes)}")
    print(f"""
  Class legend:
    D00 → Longitudinal Crack   → 'road_damage'
    D10 → Transverse Crack     → 'road_damage'
    D20 → Alligator Crack      → 'road_damage'
    D40 → Pothole              → 'pothole'   (supplement)
    D44 → Other damage         → 'road_damage'
  → Images with only D40 annotations  → pothole class
  → Images with D00/D10/D20/D44       → road_damage class
  → Images with mixed D40 + cracks    → road_damage (dominant class strategy)
  → Images with empty XML (clean road)→ EXCLUDED from classification dataset""")
    return results


# ── 3. Garbage — Kaggle Archive (folder-based) ───────────────────────────────
def explore_garbage_archive():
    separator("DATASET 3 · Garbage Classification (Kaggle Archive)")
    base = DATASET_ROOT / "garbage" / "archive" / "Garbage classification" / "Garbage classification"

    if not base.exists():
        print(f"  ✗  Not found: {base}")
        return {}

    class_dirs = [d for d in base.iterdir() if d.is_dir()]
    class_counts = {}

    print(f"\n  Format   : Folder-based classification (1 folder = 1 class)")
    print(f"  Classes  : {len(class_dirs)}")
    print()

    total = 0
    for cls_dir in sorted(class_dirs):
        n = count_images_flat(cls_dir)
        class_counts[cls_dir.name] = n
        total += n
        bar = "█" * (n // 20)
        print(f"    {cls_dir.name:12s}  {n:5d}  {bar}")

    print(f"\n  TOTAL    : {total} images")
    print(f"  → All classes merged → 'garbage' class in unified dataset")

    # check for split files
    split_files = list((DATASET_ROOT / "garbage" / "archive").glob("*.txt"))
    if split_files:
        print(f"\n  Pre-made split files found:")
        for sf in split_files:
            lines = len(sf.read_text().splitlines())
            print(f"    {sf.name}  ({lines} entries)")

    return class_counts


# ── 4. Garbage — TACO (COCO format) ─────────────────────────────────────────
def explore_taco_dataset():
    separator("DATASET 4 · TACO (Trash Annotations in Context)")
    base = DATASET_ROOT / "garbage" / "TACO" / "TACO"
    data_dir = base / "data"
    ann_file = data_dir / "annotations.json"

    if not ann_file.exists():
        print(f"  ✗  annotations.json not found: {ann_file}")
        return {}

    with open(ann_file, encoding="utf-8") as f:
        coco = json.load(f)

    images = coco.get("images", [])
    annotations = coco.get("annotations", [])
    categories = coco.get("categories", [])

    # count images per batch
    batch_counts: Counter = Counter()
    for img in images:
        file_name = img.get("file_name", "")
        batch = file_name.split("/")[0] if "/" in file_name else "root"
        batch_counts[batch] += 1

    # count annotations per category
    cat_map = {c["id"]: c["name"] for c in categories}
    ann_counts: Counter = Counter()
    for ann in annotations:
        ann_counts[cat_map.get(ann["category_id"], "unknown")] += 1

    print(f"\n  Format          : COCO (images + annotations.json)")
    print(f"  Total images    : {len(images)}")
    print(f"  Total annotations: {len(annotations)}")
    print(f"  Categories      : {len(categories)}")
    print(f"\n  Images per batch:")
    for batch, cnt in sorted(batch_counts.items()):
        print(f"    {batch:12s}  {cnt:4d} images")

    print(f"\n  Top 15 annotation categories:")
    for cat, cnt in ann_counts.most_common(15):
        bar = "█" * (cnt // 5)
        print(f"    {cat:35s}  {cnt:4d}  {bar}")

    supercats = sorted(set(c.get("supercategory", "N/A") for c in categories))
    print(f"\n  All supercategories ({len(supercats)}):")
    print(f"    {', '.join(supercats)}")
    print(f"\n  → All images → 'garbage' class in unified dataset")

    return {
        "images": len(images),
        "annotations": len(annotations),
        "categories": len(categories),
    }


# ── summary ──────────────────────────────────────────────────────────────────
def print_summary(pothole_splits, rd_results, garbage_archive, taco_info):
    separator("UNIFIED DATASET PLAN")

    # Pothole class
    pothole_yolo = sum(pothole_splits.values()) if pothole_splits else 0

    # Road damage — count annotated images per class from train
    rd_annotated_d40 = 0
    rd_annotated_damage = 0
    if rd_results and "train" in rd_results:
        rd_cls = rd_results["train"].get("classes", {})
        # images with D40 bounding boxes (approximate)
        rd_annotated_d40 = rd_cls.get("D40", 0)
        rd_annotated_damage = sum(v for k, v in rd_cls.items() if k != "D40")

    # Garbage
    garbage_archive_total = sum(garbage_archive.values()) if garbage_archive else 0
    taco_total = taco_info.get("images", 0) if taco_info else 0
    garbage_total = garbage_archive_total + taco_total

    print(f"""
  CLASS             SOURCE                              APPROX IMAGES
  ─────────────────────────────────────────────────────────────────
  pothole           YOLOv8 dataset (all images)         {pothole_yolo:>6}
                    Road Damage India D40 boxes         ~{rd_annotated_d40:>5} (bbox count)
  road_damage       Road Damage India D00/D10/D20/D44   ~{rd_annotated_damage:>5} (bbox count)
  garbage           Kaggle Archive (6 classes merged)   {garbage_archive_total:>6}
                    TACO (1500 images)                  {taco_total:>6}
  ─────────────────────────────────────────────────────────────────
  garbage total                                         {garbage_total:>6}

  NOTE: Road damage bbox counts ≠ image counts (one image can have multiple boxes).
        The prepare_dataset.py script resolves this by working at the image level.

  PLANNED SPLITS  (after balancing):
    train : 70%
    val   : 15%
    test  : 15%

  TARGET per class: ~2000 images (balance at smallest useful class)
""")


# ── main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  CIVIC SENSE PORTAL — Dataset Exploration Report")
    print(f"  Dataset root: {DATASET_ROOT}")
    print("=" * 60)

    pothole_splits = explore_pothole_dataset()
    rd_results = explore_road_damage_dataset()
    garbage_archive = explore_garbage_archive()
    taco_info = explore_taco_dataset()

    print_summary(pothole_splits, rd_results, garbage_archive, taco_info)

    separator()
    print("  Run prepare_dataset.py to build the unified dataset.")
    separator()
