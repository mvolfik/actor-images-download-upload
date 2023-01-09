FROM apify/actor-node:18

COPY package.json package-lock.json ./

RUN npm install --quiet --only=prod --no-optional \
 && npm list --only=prod --no-optional \
 && rm -rf ~/.npm

COPY src ./src

CMD [ "npm", "start" ]
