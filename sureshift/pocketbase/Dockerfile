FROM alpine:3.19

RUN apk add --no-cache ca-certificates wget unzip tzdata
ENV TZ=Asia/Kolkata

ARG PB_VERSION=0.22.20
RUN wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
    -O /tmp/pb.zip && \
    unzip -q /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

RUN mkdir -p /pb_data /pb_migrations /pb_hooks

COPY pb_migrations/ /pb_migrations/
COPY pb_hooks/      /pb_hooks/

WORKDIR /pb
EXPOSE 8091

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -q --spider http://localhost:8091/api/health || exit 1

# entrypoint is overridden by docker-compose (adds --migrationsDir etc.)
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8091", "--dir=/pb_data", "--origins=*"]
