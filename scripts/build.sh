#!/bin/bash

set -e

source /etc/os-release

export WORKSPACE=$PWD
export VERSION="$(git describe --tags --always --dirty --first-parent)"

# -----------------------------------------------------------------------------

function build_dashboard() {
    echo "build dashboard"
    cd $WORKSPACE/dashboard/
    if [ ! -d node_modules ]
    then
        npm install
    fi
    if [ -d dist ]
    then
        rm -r dist
    fi
    npm run build
}


# go tool dist list
function build_go() {
    echo "build backend on $1"
    cd $WORKSPACE/

    local pkg="github.com/saturn-xiv/loquat/env"    
    local ldflags="-a -extldflags '-static' -s -w -X '$pkg.build_time=$(date -u -R)' -X '$pkg.git_version=$VERSION'"
    local target=$WORKSPACE/tmp/loquat-$VERSION-$1
    
    mkdir -p $target/usr/bin
    CC=$2-linux-gnu-gcc CGO_ENABLED=0 GOOS=linux GOARCH=$1 go build -ldflags "$ldflags" -o $target/usr/bin/loquat
}

# https://www.debian.org/doc/debian-policy/ch-controlfields.html#debian-source-package-template-control-files-debian-control
function build_deb() {
    local package="loquat-${VERSION}_${1}.deb"
    echo "build $package"
    local target=$WORKSPACE/tmp/loquat-$VERSION-$1
    
    cd $WORKSPACE/
    mkdir -p $target/usr/share/loquat
    cp -r README.md scripts/debian.sh etc $target/usr/share/loquat/
    cp -r dashboard/dist $target/usr/share/loquat/dashboard
    cp -r .debian $target/DEBIAN
    mkdir -p $target/var/lib/$1
    chmod 400 $target/var/lib/$1

    cd $(dirname $target/)
    sed -i "7s/all/$1/g" $target/DEBIAN/control
    dpkg-deb --root-owner-group --build $target $package
}

# -----------------------------------------------------------------------------

if [ "$ID" != "ubuntu" ]
then
    echo "unsupported system $ID"
    exit 1
fi

build_dashboard loquat
build_go amd64 x86_64
build_go arm64 aarch64
build_go riscv64 riscv64

declare -a platforms=("amd64" "arm64" "riscv64")
for p in "${platforms[@]}"
do
    build_deb $p
done

echo "done."
exit 0
