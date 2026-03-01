# AI Service — Day 3 Dataset Notes & Augmentation Plan

## Dataset Inventory (actual counts)

| # | Dataset | Format | Original Images | Mapped Class |
|---|---------|--------|----------------|-------------|
| 1 | Pothole Segmentation YOLOv8 (Roboflow) | YOLOv8 seg | 780 | `pothole` |
| 2 | Road Damage India – D40 annotated images | PASCAL VOC XML | 1 006 | `pothole` |
| 3 | Road Damage India – D00/D01/D10/D11/D20/D43/D44/D50 images | PASCAL VOC XML | 2 779 | `road_damage` |
| 4 | Garbage Classification (Kaggle) | Folder-based | 2 527 | `garbage` |
| 5 | TACO (Trash Annotations in Context) | COCO | 1 500 | `garbage` |

> Road Damage India unannotated images (3 921 / 7 706) are **excluded** — they are
> plain road images with no class label.

---

## Unified Dataset (post-sampling, 70 / 15 / 15 split)

| Class | Raw | Capped | Train | Val | Test |
|-------|-----|--------|-------|-----|------|
| pothole | 1 786 | 1 786 | 1 250 | 267 | 269 |
| road_damage | 2 779 | 2 500 | 1 750 | 375 | 375 |
| garbage | 4 027 | 2 500 | 1 750 | 375 | 375 |
| **TOTAL** | **8 592** | **6 786** | **4 750** | **1 017** | **1 019** |

Output directory: `ai-service/data/unified/split/{train,val,test}/{class}/`

---

## Road Damage Class Mapping

```
RDD Code  Description              → Unified Class
────────  ───────────────────────  ───────────────
D40       Pothole                  pothole
D00       Longitudinal Crack       road_damage
D01       Longitudinal Crack (v.)  road_damage
D0w0      Longitudinal (mislabel)  road_damage
D10       Transverse Crack         road_damage
D11       Transverse Crack (v.)    road_damage
D20       Alligator Crack          road_damage
D43       Cross-walk blur          road_damage
D44       White line blur          road_damage
D50       Manhole cover damage     road_damage
```

For images with mixed labels (D40 + crack codes), the **majority** annotation
type wins; ties default to `road_damage`.

---

## Augmentation Strategy (to implement in Day 4)

### Why Augmentation?

| Class | Train count | Relative size |
|-------|-------------|---------------|
| pothole | 1 250 | 0.71× |
| road_damage | 1 750 | 1× (baseline) |
| garbage | 1 750 | 1× (baseline) |

The `pothole` class is ~29 % smaller. Augmentation will be applied more
aggressively to `pothole` during training to balance effective sample counts.

### Augmentation Techniques (Keras / Albumentations)

#### Applied to ALL classes (light augmentation):
| Transform | Parameters | Rationale |
|-----------|-----------|-----------|
| Random horizontal flip | p=0.5 | Road damage is symmetric |
| Random rotation | ±15° | Camera tilt variation |
| Brightness / contrast jitter | ±20 % | Lighting differences |
| JPEG compression noise | quality 50–95 | Real-world phone camera variation |

#### Applied to `pothole` class ONLY (heavy augmentation — 2× target):
| Transform | Parameters | Rationale |
|-----------|-----------|-----------|
| Random vertical flip | p=0.3 | Perspective variation |
| Gaussian blur | radius 0–2 | Focus / motion blur |
| Hue / saturation shift | ±10° hue, ±20 % sat | Wet vs dry road colour |
| Random zoom | 80–120 % | Distance to pothole varies |
| Grid distortion / elastic | low strength | Surface texture variation |

#### `garbage` class (medium augmentation):
| Transform | Parameters | Rationale |
|-----------|-----------|-----------|
| Random 90° rotations | p=0.5 | Variable camera orientation |
| Coarse dropout / cutout | 5–10 % area | Partial occlusion of waste |
| RGB shift | ±15 | Indoor vs outdoor lighting |

### Implementation in Keras (Day 4)

```python
from tensorflow.keras.preprocessing.image import ImageDataGenerator

train_datagen = ImageDataGenerator(
    rescale        = 1.0 / 255,
    rotation_range = 15,
    width_shift_range  = 0.1,
    height_shift_range = 0.1,
    shear_range    = 0.05,
    zoom_range     = 0.20,
    horizontal_flip    = True,
    brightness_range   = [0.8, 1.2],
    fill_mode      = "reflect",
)

val_test_datagen = ImageDataGenerator(rescale=1.0 / 255)
```

For the heavier `pothole`‑only transforms, use
[Albumentations](https://albumentations.ai/) in a custom `tf.data.Dataset`
pipeline (to be written in `ai-service/scripts/augment_pipeline.py` on Day 4).

### Class Weight Calculation (to complement augmentation)

Because augmentation alone does not fully close the gap, class weights will be
passed to `model.fit()`:

```python
from sklearn.utils.class_weight import compute_class_weight
import numpy as np

classes = ['garbage', 'pothole', 'road_damage']
# approximate train counts: [1750, 1250, 1750]
y_train = ['garbage'] * 1750 + ['pothole'] * 1250 + ['road_damage'] * 1750
weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
class_weight_dict = dict(enumerate(weights))
# expected: pothole weight ≈ 1.4×, others ≈ 1.0×
```

---

## Notes for Day 4

- Image size: resize all inputs to **224 × 224** (MobileNetV2 default)
- Colour mode: **RGB**
- Batch size: **32**  (fits in ~4 GB VRAM; reduce to 16 if OOM)
- Steps per epoch: `ceil(4750 / 32)` ≈ 149
- Validation steps: `ceil(1017 / 32)` ≈ 32
