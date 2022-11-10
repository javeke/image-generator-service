FROM node:14.21-alpine

WORKDIR /usr/app

COPY package*.json .

RUN npm install --production

RUN npm install -g pm2

COPY . .

CMD [ "pm2-runtime", "npm", "--", "start" ]
