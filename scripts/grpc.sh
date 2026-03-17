#!/bin/bash

set -e

export SOURCE_ROOT=$HOME/downloads/grpc
export BUILD_ROOT=$HOME/build/grpc
export INSTALL_ROOT=$HOME/.local

# FIXME: pip install cmake==3.31.6

function build_grpc() {
    # https://grpc.io/docs/languages/cpp/quickstart/
    if [ -L $INSTALL_ROOT/bin/protoc ]; then
        $INSTALL_ROOT/bin/protoc --version
        echo 'already exists!'
        exit 0
    fi
    if [ -d $SOURCE_ROOT ]; then
        cd $SOURCE_ROOT
        git checkout master
        git pull
        git checkout $1
        git submodule update --init --recursive
    else
        git clone --recurse-submodules -b $1 https://github.com/grpc/grpc.git $SOURCE_ROOT
    fi

    if [ -d $BUILD_ROOT ]; then
        rm -r $BUILD_ROOT
    fi

    CC=clang CXX=clang++ \
        cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_STANDARD=20 \
        -DABSL_PROPAGATE_CXX_STD=ON \
        -DgRPC_INSTALL=ON -DgRPC_SSL_PROVIDER=package -DgRPC_BUILD_TESTS=OFF \
        -DCMAKE_INSTALL_PREFIX=$INSTALL_ROOT -B $BUILD_ROOT -S $SOURCE_ROOT \
        -G Ninja
    cmake --build $BUILD_ROOT
    cmake --install $BUILD_ROOT
}

if [ "$#" -ne 1 ]; then
    echo "USAGE: $0 GRPC_VERSION"
    exit 1
fi


build_grpc $1
echo "done."

exit 0
