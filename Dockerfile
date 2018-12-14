# BUILD IMAGE
FROM node:8.11.4
WORKDIR /opt/mos-gateway
COPY . .
RUN --mount=type=cache,target=/opt/mos-gateway/node_modules yarn install --check-files --frozen-lockfile
RUN --mount=type=cache,target=/opt/mos-gateway/node_modules yarn build

# DEPLOY IMAGE
FROM node:8.11.4-alpine
RUN apk add --no-cache tzdata
COPY --from=0 /opt/mos-gateway /opt/mos-gateway
WORKDIR /opt/mos-gateway
CMD ["yarn", "start"]
