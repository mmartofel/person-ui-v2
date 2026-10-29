#!/usr/bin/env bash
# Interim: makes the namespace's Keycloak accept the UI deployed by deploy.sh, until the API repo carries these settings
# (spring-person-api-claude#1). It changes the API stack's realm data, not its Deployments:
# - realm frontendUrl = https://<UI host>, so Keycloak builds https URLs behind the router's TLS (it has no proxy-headers);
# - the UI client gets https://<UI host> as redirect URI, web origin and post-logout redirect (existing entries kept).
# Keycloak start-dev imports its realm ConfigMap at every start, so the ConfigMap is updated and the pod recreated.
# A `skaffold run` from the API repo writes a new realm ConfigMap and undoes this; run the script again then.
# Same settings as deploy.sh (NAMESPACE, HOST or APPS_DOMAIN, REALM, OIDC_CLIENT_ID), plus KEYCLOAK_DEPLOYMENT.
set -euo pipefail

fail() { echo "keycloak-realm: $*" >&2; exit 1; }

NAMESPACE=${NAMESPACE:-$(oc project -q)}
if [ -z "${HOST:-}" ]; then
  APPS_DOMAIN=${APPS_DOMAIN:-$(oc get ingresses.config.openshift.io cluster -o jsonpath='{.spec.domain}' 2>/dev/null)} ||
    fail "cannot read the cluster's apps domain; set APPS_DOMAIN or HOST"
  [ -n "$APPS_DOMAIN" ] || fail "empty apps domain; set APPS_DOMAIN or HOST"
  HOST=person-ui-v2-$NAMESPACE.$APPS_DOMAIN
fi
REALM=${REALM:-person}
OIDC_CLIENT_ID=${OIDC_CLIENT_ID:-person-ui}
KEYCLOAK_DEPLOYMENT=${KEYCLOAK_DEPLOYMENT:-keycloak}
UI=https://$HOST
oc_ns() { oc -n "$NAMESPACE" "$@"; }

deployment=$(oc_ns get deployment "$KEYCLOAK_DEPLOYMENT" -o json) || fail "deployment $KEYCLOAK_DEPLOYMENT not found"
cm=$(jq -r '[.spec.template.spec.volumes[]?.configMap.name // empty][0] // empty' <<<"$deployment")
[ -n "$cm" ] || fail "deployment $KEYCLOAK_DEPLOYMENT mounts no ConfigMap with the realm import"
selector=$(jq -r '.spec.selector.matchLabels | to_entries | map("\(.key)=\(.value)") | join(",")' <<<"$deployment")

current=$(oc_ns get configmap "$cm" -o json)
updated=$(jq --arg ui "$UI" --arg realm "$REALM" --arg client "$OIDC_CLIENT_ID" '
  .data |= with_entries(
    (try (.value | fromjson) catch null) as $r
    | if ($r | type) == "object" and $r.realm == $realm then
        .value = ($r
          | .attributes = ((.attributes // {}) + {frontendUrl: $ui})
          | .clients |= map(
              if .clientId == $client then
                .redirectUris = ((.redirectUris // []) + [$ui + "/*"] | unique)
                | .webOrigins = ((.webOrigins // []) + [$ui] | unique)
                | .attributes["post.logout.redirect.uris"] =
                    ((.attributes["post.logout.redirect.uris"] // "") | split("##") | map(select(. != ""))
                     | . + [$ui + "/*"] | unique | join("##"))
              else . end)
          | tojson)
      else . end)' <<<"$current")

jq -e --arg realm "$REALM" --arg client "$OIDC_CLIENT_ID" \
  '[.data[] | try fromjson catch null | select(.realm == $realm) | .clients[] | select(.clientId == $client)] | length > 0' \
  <<<"$updated" >/dev/null || fail "ConfigMap $cm holds no realm $REALM with client $OIDC_CLIENT_ID"

# Compared as parsed JSON: the same realm written with other formatting needs no Keycloak restart.
parsed='.data | map_values(try fromjson catch .)'
if [ "$(jq -S "$parsed" <<<"$current")" = "$(jq -S "$parsed" <<<"$updated")" ]; then
  echo "Realm $REALM already accepts $UI (ConfigMap $cm unchanged)."
else
  jq 'del(.metadata.resourceVersion, .metadata.uid, .metadata.creationTimestamp, .metadata.managedFields)' <<<"$updated" |
    oc_ns replace -f -
  oc_ns delete pod -l "$selector" --wait=false
  oc_ns rollout status deployment/"$KEYCLOAK_DEPLOYMENT" --timeout=300s
fi

echo "Waiting for the issuer https://$HOST/realms/$REALM ..."
for _ in $(seq 60); do
  issuer=$(curl -fsS "$UI/realms/$REALM/.well-known/openid-configuration" 2>/dev/null | jq -r .issuer 2>/dev/null || true)
  [ "$issuer" = "$UI/realms/$REALM" ] && { echo "Keycloak ready: issuer $issuer"; exit 0; }
  sleep 5
done
fail "issuer is '${issuer:-unreachable}', expected $UI/realms/$REALM (has deploy.sh created the Routes?)"
