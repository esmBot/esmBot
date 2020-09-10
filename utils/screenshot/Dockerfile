# if your install supports docker and you don't want to run chromium directly then you can use this dockerfile instead
# this also comes with a squid proxy to automatically handle errors and some privacy stuff
# adapted from https://github.com/westy92/headless-chrome-alpine/blob/master/Dockerfile

FROM alpine:edge

RUN apk --no-cache upgrade && apk add --no-cache chromium squid sudo libstdc++ harfbuzz nss freetype ttf-freefont zlib-dev wait4ports dbus chromium-chromedriver grep

ENV ALL_PROXY "http://localhost:3128"
RUN echo -e "\nvisible_hostname esmBot\nforwarded_for delete\nvia off\nfollow_x_forwarded_for deny all \
\nrequest_header_access X-Forwarded-For deny all\nerror_default_language en\n" >> /etc/squid/squid.conf
COPY ./ERR_DNS_FAIL /usr/share/squid/errors/en/

RUN adduser esmBot -s /bin/sh -D
WORKDIR /home/esmBot/.internal
COPY ./start.sh .
RUN chmod +x start.sh
RUN echo -e "\nesmBot ALL=(ALL) NOPASSWD:ALL\n" >> /etc/sudoers
USER esmBot

EXPOSE 9222

ENTRYPOINT ["sh", "./start.sh"]