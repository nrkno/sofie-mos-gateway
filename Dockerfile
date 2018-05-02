# BUILD IMAGE
FROM node:8.11.1 AS build
WORKDIR /opt/mos-gateway
COPY . .
RUN rm yarn.lock
RUN yarn install --check-files
RUN yarn build

# DEPLOY IMAGE
FROM node:8.11.1-alpine
COPY --from=build /opt/mos-gateway /opt/mos-gateway
WORKDIR /opt/mos-gateway
CMD ["yarn", "start"]
