
FILMS_SRC_S3=s3://enthusiate.com
FILMS=NowhereToHide TheRoomWithoutWalls TonPoertefeuille YouLovedToDance

.PHONY: download-films
download-films: $(addsuffix .mp4,$(addprefix films/raw/,$(FILMS)))

.PHONY: process-films
process-films: $(addprefix films/,$(FILMS))

films/raw/%:
	mkdir -p films/raw
	aws s3 cp $(FILMS_SRC_S3)/$* films/raw/

# Pattern rule: for any target X that depends on X.mp4
films/%: films/raw/%.mp4
	@echo "Creating output folder 'films/$*' and converting $<..."
	@mkdir -p films/$*
	@# 1080p Rendition (Full HD, 1920x1080)
	ffmpeg -i $< \
	  -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" \
	  -c:a aac -ar 48000 -b:a 128k \
	  -c:v h264 -profile:v main -crf 20 -g 48 -sc_threshold 0 \
	  -b:v 5000k -maxrate 5350k -bufsize 7500k \
	  -hls_time 4 -hls_playlist_type vod \
	  -hls_segment_filename "films/$*/1080p_%03d.ts" \
	  films/$*/1080p.m3u8
	@# 720p Rendition (1280x720)
	ffmpeg -i $< \
	  -vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease" \
	  -c:a aac -ar 48000 -b:a 128k \
	  -c:v h264 -profile:v main -crf 22 -g 48 -sc_threshold 0 \
	  -b:v 3000k -maxrate 3210k -bufsize 4500k \
	  -hls_time 4 -hls_playlist_type vod \
	  -hls_segment_filename "films/$*/720p_%03d.ts" \
	  films/$*/720p.m3u8
	@# 480p Rendition (854x480) with pad to force even dimensions
	ffmpeg -i $< \
	  -vf "scale=w=854:h=480:force_original_aspect_ratio=decrease,pad=854:480:(854-iw)/2:(480-ih)/2" \
	  -c:a aac -ar 48000 -b:a 128k \
	  -c:v h264 -profile:v main -crf 24 -g 48 -sc_threshold 0 \
	  -b:v 1500k -maxrate 1605k -bufsize 2250k \
	  -hls_time 4 -hls_playlist_type vod \
	  -hls_segment_filename "films/$*/480p_%03d.ts" \
	  films/$*/480p.m3u8
	@echo "Generating master playlist..."
	@echo "#EXTM3U" > films/$*/master.m3u8
	@echo "#EXT-X-VERSION:3" >> films/$*/master.m3u8
	@echo "" >> films/$*/master.m3u8
	@echo "#EXT-X-STREAM-INF:BANDWIDTH=5350000,RESOLUTION=1920x1080" >> films/$*/master.m3u8
	@echo "1080p.m3u8" >> films/$*/master.m3u8
	@echo "" >> films/$*/master.m3u8
	@echo "#EXT-X-STREAM-INF:BANDWIDTH=3210000,RESOLUTION=1280x720" >> films/$*/master.m3u8
	@echo "720p.m3u8" >> films/$*/master.m3u8
	@echo "" >> films/$*/master.m3u8
	@echo "#EXT-X-STREAM-INF:BANDWIDTH=1605000,RESOLUTION=854x480" >> films/$*/master.m3u8
	@echo "480p.m3u8" >> films/$*/master.m3u8

