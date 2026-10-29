#!/usr/bin/env bash
# Deploys the UI to an OpenShift namespace that already runs its API stack (API + Keycloak), README "Deploy" >
# "OpenShift". Every value defaults to what the cluster or the repo says; override any of them through the environment,
# e.g. NAMESPACE=orders IMAGE=quay.io/acme/orders-ui:1a2b3c4 deploy/openshift/deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

fail() { echo "deploy: $*" >&2; exit 1; }

NAMESPACE=${NAMESPACE:-$(oc project -q)}
if [ -z "${HOST:-}" ]; then
  APPS_DOMAIN=${APPS_DOMAIN:-$(oc get ingresses.config.openshift.io cluster -o jsonpath='{.spec.domain}' 2>/dev/null)} ||
    fail "cannot read the cluster's apps domain; set APPS_DOMAIN or HOST"
  [ -n "$APPS_DOMAIN" ] || fail "empty apps domain; set APPS_DOMAIN or HOST"
  HOST=person-ui-v2-$NAMESPACE.$APPS_DOMAIN
fi
IMAGE=${IMAGE:-quay.io/mmartofe/person-ui-v2:$(git rev-parse --short HEAD)}
REALM=${REALM:-person}
OIDC_CLIENT_ID=${OIDC_CLIENT_ID:-person-ui}
KEYCLOAK_SERVICE=${KEYCLOAK_SERVICE:-keycloak}
API_SERVICE=${API_SERVICE:-spring-person-api}

oc get namespace "$NAMESPACE" >/dev/null || fail "namespace $NAMESPACE not found"
for svc in "$KEYCLOAK_SERVICE" "$API_SERVICE"; do
  oc -n "$NAMESPACE" get service "$svc" >/dev/null 2>&1 || fail "service $svc not found in $NAMESPACE"
done
API_PORT=$(oc -n "$NAMESPACE" get service "$API_SERVICE" -o jsonpath='{.spec.ports[0].port}')
oc image info "$IMAGE" >/dev/null 2>&1 || fail "image $IMAGE not found (build and push it first, README \"Deploy\")"

# Read by kustomization.yaml (replacements); git-ignored. CONNECTS_TO assumes each Deployment is named like its Service.
cat > params.env <<EOF
HOST=$HOST
IMAGE=$IMAGE
OIDC_AUTHORITY=https://$HOST/realms/$REALM
OIDC_CLIENT_ID=$OIDC_CLIENT_ID
API_UPSTREAM=http://$API_SERVICE:$API_PORT
REALM_PATH=/realms/$REALM
KEYCLOAK_SERVICE=$KEYCLOAK_SERVICE
CONNECTS_TO=[{"apiVersion":"apps/v1","kind":"Deployment","name":"$KEYCLOAK_SERVICE"}]
EOF

oc apply -n "$NAMESPACE" -k .
# The container reads the ConfigMap at start only.
oc -n "$NAMESPACE" rollout restart deployment/person-ui-v2
oc -n "$NAMESPACE" rollout status deployment/person-ui-v2 --timeout=180s

echo "UI: https://$HOST"
echo "Keycloak must accept it: run deploy/openshift/keycloak-realm.sh with the same settings (once per namespace)."
