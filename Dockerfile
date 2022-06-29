FROM apify/actor-node

RUN apk add --no-cache patch

COPY package.json package-lock.json ./

RUN npm install --quiet --only=prod --no-optional \
 && npm list --only=prod --no-optional \
 && rm -rf ~/.npm

COPY patches ./patches
RUN cat patches/* | patch -p1

COPY src ./src

CMD [ "npm", "start" ]
