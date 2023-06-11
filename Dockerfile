# Docker/Kubernetes file for running the bot
#FROM node:alpine
FROM alpine:edge

RUN apk --no-cache upgrade
RUN apk add --no-cache git cmake msttcorefonts-installer python3 alpine-sdk ffmpeg wget rpm2cpio \
    zlib-dev libpng-dev libjpeg-turbo-dev freetype-dev fontconfig-dev \
    libtool libwebp-dev libxml2-dev freetype fontconfig \
		vips vips-dev grep libc6-compat nodejs-current nodejs-current-dev npm

# install pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
  npm install -g pnpm@8.6.2

# liblqr needs to be built manually for magick to work
# and because alpine doesn't have it in their repos
RUN git clone https://github.com/carlobaldassi/liblqr \
		&& cd liblqr \
		&& ./configure \
		&& make \
		&& make install

# install imagemagick from source rather than using the package
# since the alpine package does not include liblqr support.
RUN git clone https://github.com/ImageMagick/ImageMagick.git ImageMagick \
    && cd ImageMagick \
    && ./configure \
		--prefix=/usr \
		--sysconfdir=/etc \
		--mandir=/usr/share/man \
		--infodir=/usr/share/info \
		--enable-static \
		--disable-openmp \
		--with-threads \
		--with-png \
		--with-webp \
		--with-modules \
		--with-pango \
		--without-hdri \
		--with-lqr \
    && make \
    && make install

RUN update-ms-fonts && fc-cache -f

RUN adduser esmBot -s /bin/sh -D
USER esmBot

WORKDIR /home/esmBot/.internal

COPY --chown=esmBot:esmBot ./package.json package.json
COPY --chown=esmBot:esmBot ./pnpm-lock.yaml pnpm-lock.yaml
RUN pnpm install
COPY . .
RUN rm .env
RUN pnpm run build

RUN mkdir /home/esmBot/help \
		&& chown esmBot:esmBot /home/esmBot/help \
		&& chmod 777 /home/esmBot/help

RUN mkdir /home/esmBot/temp \
		&& chown esmBot:esmBot /home/esmBot/temp \
		&& chmod 777 /home/esmBot/temp

RUN mkdir /home/esmBot/.internal/logs \
		&& chown esmBot:esmBot /home/esmBot/.internal/logs \
		&& chmod 777 /home/esmBot/.internal/logs

ENTRYPOINT ["node", "app.js"]
