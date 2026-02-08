#!/bin/bash

set -e

source /etc/os-release

export WORKSPACE=$PWD
export VERSION="$(git describe --tags --always --dirty --first-parent)"
export PACKAGE="palm-$VERSION_CODENAME-$VERSION"
export TARGET=$WORKSPACE/tmp/$PACKAGE

# -----------------------------------------------------------------------------

function build_dashboard() {
    cd $WORKSPACE/$1/dashboard/
    if [ ! -d node_modules ]
    then
        npm install
    fi
    if [ -d dist ]
    then
        rm -r dist
    fi
    npm run build
    mkdir -p $TARGET/$1
    cp -r dist $TARGET/$1/dashboard
}


# go tool dist list
function build_go() {
    cd $WORKSPACE/$1/

    local pkg="github.com/saturn-xiv/palm/$1/env"    
    local ldflags="-a -extldflags '-static' -s -w -X '$pkg.build_time=$(date -u -R)' -X '$pkg.git_version=$(git describe --tags --always --dirty --first-parent)'"

    echo "build $1.$2 on $3"
    mkdir -p $TARGET/bin/$3    
    CC=$3-linux-gnu-gcc CGO_ENABLED=0 GOOS=linux GOARCH=$2 go build -ldflags "$ldflags" -o $TARGET/bin/$3/$1
}

# https://www.debian.org/doc/debian-policy/ch-controlfields.html#debian-source-package-template-control-files-debian-control
function build_deb() {
    local package="${1}-${VERSION}_${2}.deb"
    echo "build $package"
    local target=$WORKSPACE/tmp/$1-$2-$VERSION/$1
    if [ -d $target ]
    then
        rm -rf $(dirname $target)
    fi
    
    mkdir -p $target/usr/bin
    cp $TARGET/bin/$3/$1 $target/usr/bin/

    cd $WORKSPACE/$1/

    mkdir -p $target/etc/nginx/sites-available
    cp etc/nginx.conf $target/etc/nginx/sites-available/loquat.conf
    mkdir -p $target/etc/systemd/system/
    cp etc/systemd/* $target/etc/systemd/system/

    mkdir -p $target/usr/share/$1    
    cp -r README.md $target/usr/share/$1/
    cp -r dashboard/dist $target/usr/share/$1/dashboard
    cp -r scripts/$1 $target/usr/share/$1/scripts
    cp -r scripts/DEBIAN $target/

    mkdir -p $target/etc/$1    

    mkdir -p $target/var/lib/$1
    chmod 400 $target/var/lib/$1

    cd $(dirname $target/)
    sed -i "7s/all/$2/g" $1/DEBIAN/control
    dpkg-deb --root-owner-group --build $1 $package
}

# -----------------------------------------------------------------------------

if [ "$ID" != "ubuntu" ]
then
    echo "unsupported system $ID"
    exit 1
fi

if [ -d $TARGET ]
then
    rm -r $TARGET
fi
mkdir $TARGET


build_dashboard loquat


build_go loquat amd64 x86_64
build_go arm64 aarch64
build_go riscv64 riscv64

build_deb loquat amd64 x86_64
build_deb loquat arm64 aarch64
build_deb loquat riscv64 riscv64

build_marigold

echo "done."
exit 0
