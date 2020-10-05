FROM node:10-buster

# Firefox for dependencies
RUN apt update && apt install -y firefox-esr && apt remove -y firefox-esr

# fixed firefox version
ENV FFV=81.0.1
RUN cd /tmp && wget http://download-installer.cdn.mozilla.net/pub/firefox/releases/${FFV}/linux-x86_64/en-US/firefox-${FFV}.tar.bz2 && tar xvf firefox-${FFV}.tar.bz2 && ln -s /tmp/firefox/firefox /bin/firefox

ENV MOZ_FORCE_DISABLE_E10S=true
