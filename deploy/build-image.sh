#!/bin/sh
# Skaffold custom builder (skaffold.yaml): builds the Dockerfile with docker, or with podman when docker is missing, for
# the platform Skaffold detected on the cluster's nodes, and pushes the image when Skaffold deploys to a remote cluster.
# Skaffold sets IMAGE, PUSH_IMAGE, BUILD_CONTEXT and PLATFORMS (one platform: the cluster's).
set -eu
engine=$(command -v docker || command -v podman) || { echo "build-image: needs docker or podman" >&2; exit 1; }
platform=${PLATFORMS:-}
case "$platform" in *,*) echo "build-image: one platform at a time, got $platform (use --platform)" >&2; exit 1 ;; esac
"$engine" build ${platform:+--platform "$platform"} -t "$IMAGE" "$BUILD_CONTEXT"
if [ "${PUSH_IMAGE:-false}" = true ]; then
  "$engine" push "$IMAGE"
fi
