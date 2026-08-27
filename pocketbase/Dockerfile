FROM alpine:3.20 AS download
ARG PB_VERSION=0.40.1
ARG TARGETARCH
RUN apk add --no-cache unzip curl ca-certificates && \
    curl -fsSL -o /tmp/pb.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" && \
    unzip /tmp/pb.zip -d /pb

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=download /pb/pocketbase /usr/local/bin/pocketbase
WORKDIR /pb
COPY pb_migrations ./pb_migrations
COPY pb_hooks ./pb_hooks
EXPOSE 8090
VOLUME /pb/pb_data
CMD ["pocketbase", "serve", "--http=0.0.0.0:8090"]
