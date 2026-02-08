#!/bin/bash

set -e

export WORKSPACE=$PWD

# https://code.visualstudio.com/docs/languages/go
go install golang.org/x/tools/gopls@latest
go install github.com/go-delve/delve/cmd/dlv@latest
go install honnef.co/go/tools/cmd/staticcheck@latest

# https://grpc.io/docs/languages/go/quickstart/
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

cd $WORKSPACE/
go get -u
go mod tidy

echo 'done.'
