#!/bin/bash

set -e

# https://vite.dev/guide/#scaffolding-your-first-vite-project
npm install --save \
    bulma \
    react-router react-intl \
    @graphiql/react \
    formik yup usehooks-ts \
    jose dayjs ipaddr.js \
    @reduxjs/toolkit react-redux \
    js-cookie @types/js-cookie 

exit 0
