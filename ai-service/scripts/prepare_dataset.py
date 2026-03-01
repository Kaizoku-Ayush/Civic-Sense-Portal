"""
=====================================
Builds a unified image-classification dataset from three source datasets:

  Source 1  Pothole Segmentation YOLOv8
            → class: pothole
  Source 2  Road Damage India (PASCAL VOC XML, annotated train split only)
            D40 dominant image  → class: pothole  (supplement)
            D00/D10/D20/D44     → class: road_damage
  Source 3  Garbage - Kaggle Archive (folder-based)
            → class: garbage
  Source 4  Garbage - TACO (COCO, images only — all litter)
            → class: garbage

Output structure
─────────────────
ai-service/data/unified/
├── raw/                   ← all collected images per class (before split)
│   ├── pothole/
│   ├── road_damage/
│   └── garbage/
└── split/                 ← final train / val / test splits
    ├── train/
    │   ├── pothole/
    │   ├── road_damage/
    │   └── garbage/
    ├── val/
    │   ├── pothole/
    │   ├── road_damage/
    │   └── garbage/
    └── test/
        ├── pothole/
        ├── road_damage/
        └── garbage/

Run from project root:
    python ai-service/scripts/prepare_dataset.py [--max_per_class N] [--dry-run]

Options:
    --max_per_class N   Cap each class at N images before splitting (default: 2500)
    --dry-run           Print what would be copied without copying
    --overwrite         Delete existing unified/ folder and start fresh
"""

import argparse
import json
import os
import random
import shutil
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

# ── project layout ────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent  # ai-service/scripts → ai-service → root
DATASET_ROOT = PROJECT_ROOT / "dataset"
UNIFIED_ROOT = SCRIPT_DIR.parent / "data" / "unified"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Road damage class routing
# D40 = Pothole  (the only pothole-category class in RDD2022/India dataset)
# All other damage codes map to → road_damage
POTHOLE_CLASSES = {"D40"}           # could extend with D43 if re-labelled later
ROAD_DAMAGE_CLASSES = {
    "D00",   # Longitudinal Crack
    "D01",   # Longitudinal Crack (variant)
    "D0w0",  # Longitudinal Crack (mislabelled variant)
    "D10",   # Transverse Crack
    "D11",   # Transverse Crack (variant)
    "D20",   # Alligator Crack
    "D43",   # Cross-walk blur / faded road marking
    "D44",   # White line blur / other road marking
    "D50",   # Manhole cover (other road damage)
}  # anything else that appears → also treated as road_damage

SPLIT_RATIOS = {"train": 0.70, "val": 0.15, "test": 0.15}
RANDOM_SEED = 42


# ── helpers ───────────────────────────────────────────────────────────────────
def iter_images(folder: Path):
    """Yield Path objects for all image files in folder (non-recursive)."""
    if not folder.exists():
        return
    for f in folder.iterdir():
        if f.is_file() and f.suffix.lower() in IMAGE_EXTS:
            yield f


def dominant_class(class_list: list[str]) -> str:
    """Return the unified class for an image given its list of annotation labels.

    Rules (in priority order):
      1. All labels are pothole codes             → 'pothole'
      2. All labels are road-damage codes         → 'road_damage'
      3. Mixed / unknown labels                   → majority wins;
         ties and unknowns default to 'road_damage'
    """
    pothole_count = sum(1 for c in class_list if c in POTHOLE_CLASSES)
    damage_count  = sum(1 for c in class_list if c in ROAD_DAMAGE_CLASSES)
    # unknowns (labels not in either set) are counted as damage
    unknown_count = len(class_list) - pothole_count - damage_count

    if pothole_count > 0 and damage_count == 0 and unknown_count == 0:
        return "pothole"
    elif pothole_count == 0:
        return "road_damage"
    else:
        # mixed image: use majority
        return "pothole" if pothole_count > (damage_count + unknown_count) else "road_damage"


def safe_copy(src: Path, dst: Path, dry_run: bool) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dry_run:
        shutil.copy2(src, dst)


# ── collectors ────────────────────────────────────────────────────────────────
def collect_pothole_yolo(dry_run: bool) -> list[Path]:
    """All images from the YOLOv8 pothole dataset → pothole class."""
    base = DATASET_ROOT / "potholes" / "Pothole_Segmentation_YOLOv8"
    images: list[Path] = []
    for split in ("train", "valid"):
        img_dir = base / split / "images"
        for img in iter_images(img_dir):
            images.append(img)
    print(f"  [pothole/YOLOv8]  {len(images)} images collected")
    return images


def collect_road_damage_india(dry_run: bool) -> dict[str, list[Path]]:
    """
    Parse PASCAL VOC XML annotations for the India train split.
    Returns a dict: {'pothole': [...paths...], 'road_damage': [...paths...]}
    Only the annotated train split is used (test split has no annotations).
    """
    ann_dir = DATASET_ROOT / "road damage" / "India" / "train" / "annotations" / "xmls"
    img_dir = DATASET_ROOT / "road damage" / "India" / "train" / "images"

    buckets: dict[str, list[Path]] = {"pothole": [], "road_damage": []}
    skipped_empty = 0
    skipped_missing = 0

    for xml_file in ann_dir.glob("*.xml"):
        try:
            root = ET.parse(xml_file).getroot()
        except ET.ParseError:
            continue

        objects = root.findall("object")
        if not objects:
            skipped_empty += 1
            continue

        classes_in_image = [
            o.find("name").text.strip()
            for o in objects
            if o.find("name") is not None
        ]

        cls = dominant_class(classes_in_image)

        # resolve image file
        filename_el = root.find("filename")
        filename = filename_el.text.strip() if filename_el is not None else xml_file.stem + ".jpg"
        img_path = img_dir / filename

        if not img_path.exists():
            # try without folder prefix in filename
            img_path = img_dir / Path(filename).name
        if not img_path.exists():
            skipped_missing += 1
            continue

        buckets[cls].append(img_path)

    print(f"  [road_damage/India]  pothole: {len(buckets['pothole'])}  "
          f"road_damage: {len(buckets['road_damage'])}  "
          f"(skipped empty={skipped_empty}, missing={skipped_missing})")
    return buckets


def collect_garbage_archive() -> list[Path]:
    """All images from Kaggle archive (6 sub-folders) → garbage class."""
    base = DATASET_ROOT / "garbage" / "archive" / "Garbage classification" / "Garbage classification"
    images: list[Path] = []
    for cls_dir in (d for d in base.iterdir() if d.is_dir()):
        for img in iter_images(cls_dir):
            images.append(img)
    print(f"  [garbage/archive]   {len(images)} images collected")
    return images


def collect_taco() -> list[Path]:
    """All images from TACO batches → garbage class."""
    data_dir = DATASET_ROOT / "garbage" / "TACO" / "TACO" / "data"
    ann_file = data_dir / "annotations.json"

    if not ann_file.exists():
        print("  [garbage/TACO]  annotations.json not found — skipped")
        return []

    with open(ann_file, encoding="utf-8") as f:
        coco = json.load(f)

    images: list[Path] = []
    missing = 0
    for img_info in coco.get("images", []):
        file_name = img_info.get("file_name", "")
        img_path = data_dir / file_name
        if img_path.exists() and img_path.suffix.lower() in IMAGE_EXTS:
            images.append(img_path)
        else:
            missing += 1

    print(f"  [garbage/TACO]      {len(images)} images collected  (missing={missing})")
    return images


# ── balancing & splitting ─────────────────────────────────────────────────────
def balance_and_split(
    class_images: dict[str, list[Path]],
    max_per_class: int,
    dry_run: bool,
) -> dict[str, dict[str, list[Path]]]:
    """
    1. Cap each class at max_per_class (random sample, reproducible).
    2. Split into train/val/test per SPLIT_RATIOS.
    Returns: {split: {class: [paths]}}
    """
    random.seed(RANDOM_SEED)
    result: dict[str, dict[str, list[Path]]] = {"train": {}, "val": {}, "test": {}}

    print()
    separator_line()
    print("  Class balancing & splitting")
    separator_line()

    for cls, paths in class_images.items():
        random.shuffle(paths)
        if len(paths) > max_per_class:
            paths = paths[:max_per_class]
            print(f"  {cls:15s}  capped at  {max_per_class}")
        else:
            print(f"  {cls:15s}  using all  {len(paths)}")

        n = len(paths)
        n_train = int(n * SPLIT_RATIOS["train"])
        n_val = int(n * SPLIT_RATIOS["val"])
        n_test = n - n_train - n_val  # absorb rounding into test

        result["train"][cls] = paths[:n_train]
        result["val"][cls] = paths[n_train: n_train + n_val]
        result["test"][cls] = paths[n_train + n_val:]

        print(f"    train={len(result['train'][cls])}  "
              f"val={len(result['val'][cls])}  "
              f"test={len(result['test'][cls])}")

    return result


def separator_line():
    print("  " + "─" * 56)


# ── writing ───────────────────────────────────────────────────────────────────
def write_split(
    split_data: dict[str, dict[str, list[Path]]],
    out_root: Path,
    dry_run: bool,
):
    """Copy images into out_root / {split} / {class} / filename.

    Naming strategy to avoid collisions:
      {source_tag}_{relative_stem}_{counter}{ext}
    where source_tag is the grandparent folder name and counter ensures
    uniqueness within the destination directory.
    """
    counters: Counter = Counter()

    for split, class_map in split_data.items():
        for cls, paths in class_map.items():
            dest_dir = out_root / "split" / split / cls
            if not dry_run:
                dest_dir.mkdir(parents=True, exist_ok=True)

            # track names used in this dest_dir to avoid collisions
            used_names: set[str] = set()

            for idx, src in enumerate(paths):
                # build a collision-resistant name
                # use: parentFolder__grandparentFolder__stem__idx.ext
                grand = src.parent.parent.name[:12]     # e.g. "batch_1" or "cardboard"
                parent = src.parent.name[:10]           # e.g. "images"
                stem   = src.stem[:30]
                ext    = src.suffix.lower()
                candidate = f"{grand}_{parent}_{stem}{ext}"
                # if still colliding, append index
                if candidate in used_names:
                    candidate = f"{grand}_{parent}_{stem}_{idx}{ext}"
                used_names.add(candidate)

                dst = dest_dir / candidate
                safe_copy(src, dst, dry_run)
                counters[f"{split}/{cls}"] += 1

    return counters


# ── verification ──────────────────────────────────────────────────────────────
def verify_split(out_root: Path):
    """Print counts of images in each split/class directory."""
    split_root = out_root / "split"
    if not split_root.exists():
        print("  unified/split/ does not exist — nothing to verify")
        return

    print()
    separator_line()
    print("  Verification — file counts in unified/split/")
    separator_line()
    print(f"  {'split':8s}  {'class':15s}  {'count':>6}")
    separator_line()

    totals: Counter = Counter()
    for split_dir in sorted(split_root.iterdir()):
        if not split_dir.is_dir():
            continue
        for cls_dir in sorted(split_dir.iterdir()):
            if not cls_dir.is_dir():
                continue
            n = sum(1 for f in cls_dir.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTS)
            print(f"  {split_dir.name:8s}  {cls_dir.name:15s}  {n:>6}")
            totals[split_dir.name] += n
            totals["total"] += n

    separator_line()
    for split in ("train", "val", "test", "total"):
        print(f"  {split:25s}  {totals[split]:>6}")
    separator_line()


# ── main ──────────────────────────────────────────────────────────────────────
def main(max_per_class: int, dry_run: bool, overwrite: bool):
    label = "DRY RUN" if dry_run else "LIVE RUN"
    print("=" * 60)
    print(f"  CIVIC SENSE PORTAL — Prepare Unified Dataset  [{label}]")
    print(f"  max_per_class = {max_per_class}")
    print(f"  output        = {UNIFIED_ROOT}")
    print("=" * 60)

    # optionally wipe previous run
    if overwrite and UNIFIED_ROOT.exists() and not dry_run:
        print(f"  Removing existing {UNIFIED_ROOT} …")
        shutil.rmtree(UNIFIED_ROOT)

    # ── collect ──────────────────────────────────────────────────────────────
    print("\n  Collecting images …")
    separator_line()

    pothole_images: list[Path] = collect_pothole_yolo(dry_run)
    rd_buckets = collect_road_damage_india(dry_run)
    garbage_archive = collect_garbage_archive()
    taco_images = collect_taco()

    class_images: dict[str, list[Path]] = {
        "pothole":     pothole_images + rd_buckets["pothole"],
        "road_damage": rd_buckets["road_damage"],
        "garbage":     garbage_archive + taco_images,
    }

    print()
    separator_line()
    print("  Raw class totals (before balancing):")
    for cls, imgs in class_images.items():
        print(f"    {cls:15s}  {len(imgs):>5} images")
    separator_line()

    # ── balance & split ───────────────────────────────────────────────────────
    split_data = balance_and_split(class_images, max_per_class, dry_run)

    # ── write to disk ─────────────────────────────────────────────────────────
    if not dry_run:
        print("\n  Copying files to unified/split/ …")
        counters = write_split(split_data, UNIFIED_ROOT, dry_run)
        print(f"  Done.  {sum(counters.values())} files written.")

    # ── verify ────────────────────────────────────────────────────────────────
    if not dry_run:
        verify_split(UNIFIED_ROOT)
    else:
        print("\n  [dry-run] No files were written.")
        print("  Run without --dry-run to actually copy files.")

    # ── save distribution report ──────────────────────────────────────────────
    if not dry_run:
        report = {
            "split_ratios": SPLIT_RATIOS,
            "max_per_class": max_per_class,
            "random_seed": RANDOM_SEED,
            "classes": list(class_images.keys()),
            "counts": {
                split: {
                    cls: len(paths)
                    for cls, paths in class_map.items()
                }
                for split, class_map in split_data.items()
            },
        }
        report_path = UNIFIED_ROOT / "dataset_report.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"\n  Distribution report saved → {report_path}")

    print("\n  All done!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare unified civic-sense dataset")
    parser.add_argument("--max_per_class", type=int, default=2500,
                        help="Maximum images per class (default: 2500)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print statistics without copying files")
    parser.add_argument("--overwrite", action="store_true",
                        help="Delete and recreate unified/ folder")
    args = parser.parse_args()

    main(
        max_per_class=args.max_per_class,
        dry_run=args.dry_run,
        overwrite=args.overwrite,
    )
