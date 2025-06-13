# Erika Urano Website

This repository contains the source code for [erikaurano.com](https://erikaurano.com).

## Media Organization

All media files are stored in S3 under `s3://enthusiate.com/erika/website/`. The structure is organized to mirror the website's content hierarchy, with raw source files separated from published content.

### S3 Structure

```
s3://enthusiate.com/erika/website/
├── raw/                    # Source files that need processing
│   ├── films/
│   │   ├── film1/
│   │   │   ├── source.mov  # Original film file
│   │   │   ├── locations/  # Original location photos
│   │   │   └── thumbnails/ # Original thumbnail images
│   │   └── ...
│   └── art/
│       ├── drawings/
│       │   ├── drawing1/   # Original drawing files
│       │   └── ...
│       └── animations/
│           ├── animation1/ # Original animation files
│           └── ...
└── static/                 # Published website content
    ├── images/             # Site-wide images
    ├── home/
    │   ├── images/         # image specific to home
    │   └── media/          # media specific to home
    ├── about/
    │   ├── images/
    │   └── media/
    ├── films/
    │   ├── film1/
    │   │   ├── locations/  # Processed location photos
    │   │   ├── thumbnails/ # Processed thumbnails
    │   │   └── hls/        # HLS files for video playback
    │   │       ├── index.m3u8
    │   │       └── *.ts
    │   └── ...
    └── art/
        ├── drawings/
        │   ├── drawing1/
        │   │   ├── images/ # Processed drawing images
        │   │   └── media/  # Any associated media
        │   └── ...
        └── animations/
            ├── animation1/
            │   ├── images/ # Processed animation images
            │   └── media/  # Processed animation files
            └── ...
```

### Key Points

- The `raw/` directory contains only source files that need processing:
  - Original film files (.mov) that need to be converted to HLS
  - Large images that need to be resized for web
  - Original animation files that need processing

- The `static/` directory contains all published website content:
  - Processed images optimized for web
  - HLS video files
  - Any other media needed by the website

- Each piece of content (film, drawing, animation) has its own directory containing all related files

## Workflows

### Adding New Content

1. Upload source files to appropriate directory under `raw/`
2. Process the files:
   - Convert films to HLS format
   - Resize images for web
   - Process animations
3. Upload processed files to corresponding directory under `static/`

### Processing Films

1. Place original .mov file in `raw/films/<film-name>/source.mov`
2. Run the film processing script to:
   - Generate HLS files
   - Create thumbnails
   - Process location photos
3. Upload processed files to `static/films/<film-name>/`

### Processing Art

1. Place original files in `raw/art/<type>/<piece-name>/`
2. Process files:
   - Resize images for web
   - Convert animations to web format
3. Upload processed files to `static/art/<type>/<piece-name>/`

### Website Deployment

The website only uses files from the `static/` directory. When deploying:
1. Hugo builds the site using files from `static/`
2. The build process copies these files to `public/static/`
3. The entire `public/` directory is deployed to the website

## Development

To work on the website locally:

1. Sync the `static/` directory from S3:
   ```bash
   aws s3 sync s3://enthusiate.com/erika/website/static/ static/
   ```

2. Run Hugo in development mode:
   ```bash
   hugo server
   ```

3. Make changes and test locally

4. When ready to deploy:
   ```bash
   hugo
   aws s3 sync public/ s3://erikaurano.com/ --delete
   ``` 
