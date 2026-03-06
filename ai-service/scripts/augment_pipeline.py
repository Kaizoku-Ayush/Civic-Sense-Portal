"""
augment_pipeline.py  —  Day 4
Custom Albumentations augmentation pipeline for the Civic Sense Portal
unified dataset (pothole / road_damage / garbage).

Provides:
    get_train_transforms(label)  →  A.Compose  (label-specific)
    get_val_test_transforms()    →  A.Compose  (resize & normalise only)
    AlbumentationsDataset        →  tf.keras-compatible dataset helper
"""

from __future__ import annotations

import os
import pathlib
from typing import Literal

import albumentations as A
import cv2
import numpy as np

# ── Constants ────────────────────────────────────────────────────────────────
IMG_SIZE = 224          # MobileNetV2 default input
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD  = (0.229, 0.224, 0.225)

CLASS_NAMES = ["garbage", "pothole", "road_damage"]   # alphabetical → integer index
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASS_NAMES)}


# ── Augmentation factories ────────────────────────────────────────────────────

def _base_transforms() -> list:
    """Light augmentation applied to every class."""
    return [
        A.HorizontalFlip(p=0.5),
        A.Rotate(limit=15, border_mode=cv2.BORDER_REFLECT_101, p=0.6),
        A.RandomBrightnessContrast(brightness_limit=0.20, contrast_limit=0.20, p=0.6),
        A.ImageCompression(quality_range=(50, 95), p=0.3),
    ]


def _pothole_extra_transforms() -> list:
    """Heavy augmentation applied to the pothole class to compensate smaller count."""
    return [
        A.VerticalFlip(p=0.3),
        A.GaussianBlur(blur_limit=(3, 5), p=0.3),
        A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=10, p=0.4),
        A.RandomScale(scale_limit=0.20, p=0.4),
        A.GridDistortion(num_steps=5, distort_limit=0.10, p=0.2),
        A.ElasticTransform(alpha=1, sigma=30, p=0.2),
    ]


def _garbage_extra_transforms() -> list:
    """Medium augmentation applied to the garbage class."""
    return [
        A.RandomRotate90(p=0.5),
        A.CoarseDropout(
            num_holes_range=(4, 8),
            hole_height_range=(0.05, 0.10),
            hole_width_range=(0.05, 0.10),
            p=0.3,
        ),
        A.RGBShift(r_shift_limit=15, g_shift_limit=15, b_shift_limit=15, p=0.3),
    ]


def get_train_transforms(
    label: Literal["pothole", "road_damage", "garbage"] | str,
) -> A.Compose:
    """Return an Albumentations pipeline for *training* images.

    Parameters
    ----------
    label:
        One of ``"pothole"``, ``"road_damage"``, ``"garbage"``.
        Unknown labels fall back to the light-only pipeline.
    """
    transforms: list = [A.Resize(IMG_SIZE, IMG_SIZE)]
    transforms.extend(_base_transforms())

    if label == "pothole":
        transforms.extend(_pothole_extra_transforms())
    elif label == "garbage":
        transforms.extend(_garbage_extra_transforms())

    # Final resize ensures consistent output shape regardless of any
    # spatial augmentation (e.g. RandomScale) applied above.
    transforms.append(A.Resize(IMG_SIZE, IMG_SIZE))
    transforms.append(
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    )
    return A.Compose(transforms)


def get_val_test_transforms() -> A.Compose:
    """Validation / test pipeline — resize + normalise only (no augmentation)."""
    return A.Compose([
        A.Resize(IMG_SIZE, IMG_SIZE),
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


# ── Dataset helper ────────────────────────────────────────────────────────────

class AlbumentationsDataset:
    """Loads images from a folder-split directory and applies Albumentations.

    Directory layout expected::

        split_root/
            garbage/   *.jpg  *.jpeg  *.png
            pothole/
            road_damage/

    Yields (image_array, one_hot_label) tuples compatible with
    ``tf.data.Dataset.from_generator``.

    Parameters
    ----------
    split_root : str | Path
        Path to the split directory (e.g. ``.../unified/split/train``).
    augment : bool
        If *True* the label-specific training pipeline is applied;
        otherwise uses the val/test (no-aug) pipeline.
    shuffle : bool
        Shuffle sample list on construction.
    seed : int
        Random seed for reproducibility.
    """

    _EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    def __init__(
        self,
        split_root: str | pathlib.Path,
        augment: bool = False,
        shuffle: bool = True,
        seed: int = 42,
    ):
        self.split_root = pathlib.Path(split_root)
        self.augment = augment
        self._samples: list[tuple[pathlib.Path, int, str]] = []   # (path, idx, label)

        for class_name in CLASS_NAMES:
            class_dir = self.split_root / class_name
            if not class_dir.is_dir():
                continue
            idx = CLASS_TO_IDX[class_name]
            for fpath in class_dir.iterdir():
                if fpath.suffix.lower() in self._EXTENSIONS:
                    self._samples.append((fpath, idx, class_name))

        if shuffle:
            rng = np.random.default_rng(seed)
            rng.shuffle(self._samples)  # type: ignore[arg-type]

    def __len__(self) -> int:
        return len(self._samples)

    def _load_image(self, path: pathlib.Path) -> np.ndarray:
        img = cv2.imread(str(path))
        if img is None:
            raise FileNotFoundError(f"Could not read image: {path}")
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def __iter__(self):
        for fpath, class_idx, class_name in self._samples:
            img = self._load_image(fpath)
            if self.augment:
                transform = get_train_transforms(class_name)
            else:
                transform = get_val_test_transforms()
            img = transform(image=img)["image"].astype(np.float32)
            yield img, class_idx

    def class_counts(self) -> dict[str, int]:
        counts: dict[str, int] = {c: 0 for c in CLASS_NAMES}
        for _, _, name in self._samples:
            counts[name] += 1
        return counts


# ── Quick sanity check (run directly) ────────────────────────────────────────

if __name__ == "__main__":
    import sys

    data_root = pathlib.Path(__file__).resolve().parents[1] / "data" / "unified" / "split"
    for split in ("train", "val", "test"):
        ds = AlbumentationsDataset(data_root / split, augment=(split == "train"))
        print(f"[{split:5s}]  total={len(ds)}  counts={ds.class_counts()}")
        # grab one batch to confirm shapes
        for img, label in ds:
            print(f"         sample shape={img.shape}  dtype={img.dtype}  label={label}")
            break

    print("\naugment_pipeline.py OK")
