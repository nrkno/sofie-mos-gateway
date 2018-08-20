# BUILD IMAGE
FROM node:8.11.1 AS build
WORKDIR /opt/mos-gateway
COPY . .
RUN yarn install --check-files --frozen-lockfile
RUN yarn build

# DEPLOY IMAGE
FROM node:8.11.1-alpine
RUN apk add --no-cache tzdata
COPY --from=build /opt/mos-gateway /opt/mos-gateway
WORKDIR /opt/mos-gateway
CMD ["yarn", "start"]
