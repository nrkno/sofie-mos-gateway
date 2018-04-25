# use latest node lts
FROM node:8.11.1-alpine

WORKDIR /opt/mos-gateway
RUN apk add --no-cache git
RUN apk add --no-cache tzdata
RUN apk add --no-cache python
RUN apk add --no-cache alpine-sdk
ENV TZ Europe/Oslo
COPY . .
RUN rm yarn.lock
RUN yarn install
RUN yarn build
CMD ["yarn", "start"]
