# AI Service

Python-based FastAPI microservice for civic-issue image classification and severity scoring.

## Structure

```
ai-service/
├── data/
│   └── unified/          # generated — run prepare_dataset.py first
│       ├── split/
│       │   ├── train/    # 4 750 images (pothole / road_damage / garbage)
│       │   ├── val/      # 1 017 images
│       │   └── test/     # 1 019 images
│       └── dataset_report.json
├── models/               # trained model checkpoints (Day 4+)
├── scripts/
│   ├── explore_datasets.py   # Day 3 — dataset stats & analysis
│   └── prepare_dataset.py    # Day 3 — build unified classification dataset
├── DATASET_NOTES.md          # Day 3 — data notes & augmentation plan
├── requirements.txt
└── README.md
```

## Setup

```bash
# from project root
python -m venv ai-service/.venv
ai-service\.venv\Scripts\activate         # Windows
# source ai-service/.venv/bin/activate    # macOS / Linux

pip install -r ai-service/requirements.txt
# installs: TensorFlow 2.20, Keras 3.13, OpenCV 4.13, Albumentations 2.x, FastAPI, etc.
```

## Dataset Preparation (Day 3)

All source datasets live in `dataset/` at the project root (gitignored).

| Dataset | Path | Format |
|---------|------|--------|
| Pothole YOLOv8 | `dataset/potholes/Pothole_Segmentation_YOLOv8/` | YOLOv8 seg |
| Road Damage India | `dataset/road damage/India/` | PASCAL VOC XML |
| Garbage Kaggle | `dataset/garbage/archive/` | Folder-based |
| TACO | `dataset/garbage/TACO/TACO/` | COCO JSON |

```bash
# explore stats
python ai-service/scripts/explore_datasets.py

# build unified dataset (creates ai-service/data/unified/)
python ai-service/scripts/prepare_dataset.py

# optional flags
#   --max_per_class 1500   cap each class at 1500 images
#   --dry-run              print counts without copying
#   --overwrite            delete existing unified/ and rebuild
```

**Output:** `ai-service/data/unified/split/{train,val,test}/{pothole,road_damage,garbage}/`

See [DATASET_NOTES.md](./DATASET_NOTES.md) for full analysis and augmentation strategy.

## Classes

| Class | Description | Count (train) |
|-------|-------------|--------------|
| `pothole` | Road potholes | 1 250 |
| `road_damage` | Cracks, alligator damage, white-line blur | 1 750 |
| `garbage` | Litter, waste, trash | 1 750 |

## Roadmap

| Day | Task |
|-----|------|
| Day 3 | Dataset exploration & preparation ✅ |
| Day 4 | MobileNetV2 transfer learning — training (Part 1) |
| Day 5 | Fine-tuning, evaluation, export |
| Day 6 | FastAPI `/predict` endpoint |
| Day 7 | Integration with Node.js backend |
