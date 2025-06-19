#
# targets to process films to HLS renditions
#

# Media SRC Bucket
# we'll presume the bucket is mounted at $(MOUNT_POINT) below
MOUNT_POINT ?= $(HOME)/mnt/jl-urano
SRC_BUCKET ?= enthusiate.com
SRC_PREFIX ?= erika/website
SRCDIR = $(MOUNT_POINT)/$(SRC_BUCKET)/$(SRC_PREFIX)

# Define the Film targets
FILMS = nowhere-to-hide the-room-without-walls ton-poertefeuille you-loved-to-dance deliver-your-love
FILM_TARGETS := $(addsuffix /hls,$(addprefix $(SRCDIR)/static/films/,$(FILMS)))

# targets to process all films to hls renditions
.PHONY: process-films
process-films: $(FILM_TARGETS)
	@echo "Films processed: $(FILM_TARGETS)"

# Static pattern rule with explicit dependency mapping
$(SRCDIR)/static/films/nowhere-to-hide/hls: $(SRCDIR)/raw/films/NowhereToHide.mp4
$(SRCDIR)/static/films/the-room-without-walls/hls: $(SRCDIR)/raw/films/TheRoomWithoutWalls.mp4
$(SRCDIR)/static/films/ton-poertefeuille/hls: $(SRCDIR)/raw/films/TonPoertefeuille.mp4
$(SRCDIR)/static/films/you-loved-to-dance/hls: $(SRCDIR)/raw/films/YouLovedToDance.mp4
$(SRCDIR)/static/films/deliver-your-love/hls: $(SRCDIR)/raw/films/DeliverYourLove.mp4

# Shared command block for all the above rules
$(SRCDIR)/static/films/%/hls: 
	@echo "Creating output folder '$@' and converting $<..."
	@mkdir -p $@
	@# 1080p Rendition (Full HD, 1920x1080)
	ffmpeg -i $< \
	  -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" \
	  -c:a aac -ar 48000 -b:a 128k \
	  -c:v h264 -profile:v main -crf 20 -g 48 -sc_threshold 0 \
	  -b:v 5000k -maxrate 5350k -bufsize 7500k \
	  -hls_time 4 -hls_playlist_type vod \
	  -hls_segment_filename "$@/1080p_%03d.ts" \
	  $@/1080p.m3u8
	@# 720p Rendition (1280x720)
	ffmpeg -i $< \
	  -vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease" \
	  -c:a aac -ar 48000 -b:a 128k \
	  -c:v h264 -profile:v main -crf 22 -g 48 -sc_threshold 0 \
	  -b:v 3000k -maxrate 3210k -bufsize 4500k \
	  -hls_time 4 -hls_playlist_type vod \
	  -hls_segment_filename "$@/720p_%03d.ts" \
	  $@/720p.m3u8
	@# 480p Rendition (854x480) with pad to force even dimensions
	ffmpeg -i $< \
	  -vf "scale=w=854:h=480:force_original_aspect_ratio=decrease,pad=854:480:(854-iw)/2:(480-ih)/2" \
	  -c:a aac -ar 48000 -b:a 128k \
	  -c:v h264 -profile:v main -crf 24 -g 48 -sc_threshold 0 \
	  -b:v 1500k -maxrate 1605k -bufsize 2250k \
	  -hls_time 4 -hls_playlist_type vod \
	  -hls_segment_filename "$@/480p_%03d.ts" \
	  $@/480p.m3u8
	@echo "Generating master playlist..."
	@echo "#EXTM3U" > $@/master.m3u8
	@echo "#EXT-X-VERSION:3" >> $@/master.m3u8
	@echo "" >> $@/master.m3u8
	@echo "#EXT-X-STREAM-INF:BANDWIDTH=5350000,RESOLUTION=1920x1080" >> $@/master.m3u8
	@echo "1080p.m3u8" >> $@/master.m3u8
	@echo "" >> $@/master.m3u8
	@echo "#EXT-X-STREAM-INF:BANDWIDTH=3210000,RESOLUTION=1280x720" >> $@/master.m3u8
	@echo "720p.m3u8" >> $@/master.m3u8
	@echo "" >> $@/master.m3u8
	@echo "#EXT-X-STREAM-INF:BANDWIDTH=1605000,RESOLUTION=854x480" >> $@/master.m3u8
	@echo "480p.m3u8" >> $@/master.m3u8

#
# targets to publish the site
#

# CloudFront Distribution IDs
NEXT_DISTRIBUTION_ID = E2KOLJP07MT1RF
PROD_DISTRIBUTION_ID = E1ZSLK318ISTVD

.PHONY: publish-next
publish-next:
	$(MAKE) publish S3_BUCKET=next.erikaurano.com DISTRIBUTION_ID=$(NEXT_DISTRIBUTION_ID)

.PHONY: publish-prod
publish-prod:
	$(MAKE) publish S3_BUCKET=erikaurano.com DISTRIBUTION_ID=$(PROD_DISTRIBUTION_ID)

.PHONY: publish
publish:
	@if [ -z "$(S3_BUCKET)" ]; then \
	  echo "Error: S3_BUCKET is not defined. Please set S3_BUCKET to your target bucket."; \
	  exit 1; \
	fi
	@echo "Building Hugo site for $(S3_BUCKET)..."
	hugo --baseURL "https://$(S3_BUCKET)/" --minify
	@echo "Syncing public/ to $(S3_BUCKET)..."
	aws s3 sync public/ s3://$(S3_BUCKET)/ --delete
	@if [ -n "$(DISTRIBUTION_ID)" ]; then \
	  echo "Invalidating CloudFront distribution $(DISTRIBUTION_ID)..."; \
	  aws cloudfront create-invalidation --distribution-id $(DISTRIBUTION_ID) --paths "/*"; \
	else \
	  echo "No CloudFront distribution ID provided, skipping invalidation."; \
	fi

#
# targets to set up the static directory symlink
#
.PHONY: setup-static
setup-static:
	@echo "Setting up symbolic link to mounted static directory..."
	@ln -s $(SRCDIR)/static static
	@echo "Symbolic link created: static -> $(SRCDIR)/static"
