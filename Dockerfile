# Docker/Kubernetes file for running the bot
FROM node:alpine

RUN apk --no-cache upgrade
RUN apk add --no-cache git cmake msttcorefonts-installer python3 alpine-sdk ffmpeg wget rpm2cpio \
    zlib-dev libpng-dev libjpeg-turbo-dev freetype-dev fontconfig-dev \
    libtool libwebp-dev libxml2-dev freetype fontconfig \
		vips vips-dev grep libc6-compat

# install pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
  npm install -g pnpm@6.27.1

# gets latest version of twemoji
RUN mkdir /tmp/twemoji \
&& cd /tmp/twemoji \
&& package=$(wget --quiet -O - https://fedora.mirror.liteserver.nl/linux/development/rawhide/Everything/aarch64/os/Packages/t/ | grep -Po '(?<=href=")twitter-twemoji-fonts-[^"]*' | tail -1) \
&& wget https://fedora.mirror.liteserver.nl/linux/development/rawhide/Everything/aarch64/os/Packages/t/$package \
&& rpm2cpio $package | cpio -ivd \
&& cp ./usr/share/fonts/twemoji/Twemoji.ttf /usr/share/fonts/Twemoji.ttf \
&& rm -r /tmp/twemoji

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
WORKDIR /home/esmBot/.internal

COPY ./assets/caption.otf /usr/share/fonts/caption.otf
COPY ./assets/caption2.ttf /usr/share/fonts/caption2.ttf
COPY ./assets/hbc.ttf /usr/share/fonts/hbc.ttf
COPY ./assets/reddit.ttf /usr/share/fonts/reddit.ttf
COPY ./assets/whisper.otf /usr/share/fonts/whisper.otf
RUN fc-cache -fv

COPY --chown=node:node ./package.json package.json
COPY --chown=node:node ./pnpm-lock.yaml pnpm-lock.yaml
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

USER esmBot

ENTRYPOINT ["node", "app.js"]
