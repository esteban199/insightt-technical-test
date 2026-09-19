#!/usr/bin/env bash
# Re-create symlinks for hoisted packages inside the mobile workspace
# so gradle + metro + node can find them at expected paths.
set -e
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/mobile"
MN="$MOBILE_DIR/node_modules"
mkdir -p "$MN/@react-native"

# react-native itself
[ -d "$ROOT_DIR/node_modules/react-native" ] && {
  rm -rf "$MN/react-native" 2>/dev/null || true
  ln -s "$ROOT_DIR/node_modules/react-native" "$MN/react-native"
}

# @react-native/* packages
for pkg in codegen community-cli-plugin gradle-plugin babel-preset eslint-config metro-config typescript-config dev-middleware; do
  if [ -d "$ROOT_DIR/node_modules/@react-native/$pkg" ]; then
    rm -rf "$MN/@react-native/$pkg" 2>/dev/null || true
    ln -s "$ROOT_DIR/node_modules/@react-native/$pkg" "$MN/@react-native/$pkg"
  fi
done
echo "Symlinks restored"