#!/bin/bash

set -e

export WORKSPACE=$PWD
export PROTOBUF_HOME=$HOME/.local

function generate_grpc_for_go() {
    echo "generate protocols for $1"
    cd $WORKSPACE/
    local target=$WORKSPACE/$1/v2
    if [ -d $target ]
    then
        rm -f $target/*.pb.go
    else
        mkdir -p $target
    fi
    $PROTOBUF_HOME/bin/protoc -I $PROTOBUF_HOME/include/google/protobuf -I $WORKSPACE/proto \
        --go_out=$target --go_opt=paths=import --go-grpc_out=$target --go-grpc_opt=paths=import \
        $WORKSPACE/proto/$1.proto    
}

generate_grpc_for_go router

echo 'done.'
exit 0
